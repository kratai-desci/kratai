# kratai Web App — Requirements

Status: Draft (requirements only, no implementation yet)
Scope: `apps/web`

## 1. Overview

A web version of kratai that lets a user connect their GitHub account, pick a
repo + branch, and generate the same interactive architecture diagram the
VS Code extension produces — without needing the repo checked out locally.
Diagrams can be saved (multiple per repo/branch, like the extension's saved
"views"), regenerated, and exported as a Markdown file for feeding into an AI
coding agent as architectural context.

This app is a new workspace member (`apps/web`) in the existing npm
workspaces monorepo and is expected to reuse `packages/core` (parsing,
enrichment, git-diff, export, view model) and `packages/viewer` (diagram
HTML rendering) as-is rather than reimplementing that logic.

## 2. Goals

- Log in with GitHub OAuth.
- List the user's accessible repos (or let them enter/search one) and pick a
  branch.
- Configure a diagram the same way the extension's config panel does:
  folder selection, file-extension selection, class-type filters,
  relationship-type filters, HTTP-call detection toggle, framework-
  enrichment toggle. (Git-diff visualization is out of scope for v1 — see
  §3.)
- Generate the diagram and view it interactively in the browser (pan/zoom,
  click a class to jump to source — source jump opens the file on GitHub
  instead of a local editor).
- Save multiple named diagrams ("views") per repo/branch, list them, re-run
  them, rename/delete them — same mental model as the extension's sidebar
  (Diagrams + Exports groups).
- Export the generated diagram as a `.md` file (same format as
  `MarkdownExporter.toMarkdown`) for the user to download and feed to an AI
  agent as architecture context.
- Persist users' saved views (and whatever else needs persistence) in
  MongoDB Atlas.

## 3. Non-Goals / Known Limitations

- **No local filesystem access.** Unlike the VS Code extension, the web app
  never reads a folder already on the user's machine. Every diagram is
  generated from a GitHub-hosted repo/branch the user has access to.
- Not building a general-purpose GitHub browser/IDE — just enough repo/branch
  picking to drive diagram generation.
- Real-time collaboration on a saved diagram is out of scope for v1.
- Editing code from the web app is out of scope — read-only, diagram +
  "open on GitHub" links only.
- **Git-diff visualization is out of scope for v1.** The extension's
  "highlight uncommitted/unpushed changes" feature depends on a live local
  working tree and doesn't map cleanly onto a server-side clone of a single
  branch's committed state. No git-diff toggle, no changed-lines
  highlighting in the web app for now.
- **No GitHub App / fine-grained per-org installation.** Plain OAuth only
  for v1 (see §4.1). Org-owned private repos are only accessible if the
  org's third-party OAuth app policy allows it and the user has access.
- **No caching.** Every diagram generation does a fresh clone and fresh
  parse; nothing about the source or the generated diagram is cached
  server-side between requests.
- **No repo size or clone-depth limit** is enforced by the app itself
  (see §5.3 for the hosting platform's own timeout, which is a separate,
  real ceiling).

## 4. User Flows

### 4.1 Authentication
- "Sign in with GitHub" (OAuth).
- Plain GitHub OAuth (not a GitHub App) — kept simple for v1. Scopes: read
  access to repo contents/metadata for the repos the user wants to diagram
  (public repos need minimal scope; private repos need `repo` read access).
  Exact scope list is an implementation detail, but the requirement is: the
  user must be able to diagram their own private repos, not just public
  ones.
- Org-owned repos: accessible only to the extent the org allows
  third-party OAuth apps and the user has access — no per-org installation
  flow or fine-grained permissions (that's a GitHub App concern, explicitly
  deferred — see §3).
- After login, the user lands on a dashboard of their previously saved
  diagrams (if any) plus an entry point to create a new one.

### 4.2 Repo & Branch Selection
- User picks a repo from their GitHub account (own repos + orgs they have
  access to, at minimum) and a branch within that repo.
- This is the equivalent of "open a workspace folder" in the extension.

### 4.3 Diagram Configuration (parity with extension's config panel)
Reference: `apps/vsextension/src/commands/showConfigPanel.ts`.

The web config UI should offer the same knobs `KrataiConfig` exposes
(`packages/core/src/types/config/KrataiConfig.ts`):
- Folder tree with per-folder selection + custom ordering
  (`selectedFolders` / `folders`).
- File extension selection (`selectedExtensions`), pre-populated from a scan
  of the repo similar to `WorkspaceScanner.scanExtensionCounts`.
- Class-type filters (class/interface/abstract/module/route/entity/etc.).
- Relationship-type filters (extends/implements/calls/imports/http-call/
  ORM relationships/etc.).
- HTTP call detection toggle (`detectHttpCalls`).
- Framework enrichment toggle (`frameworkEnrichment`) — Django/Next.js/
  Spring Boot enrichers already exist in `packages/core`.
- Diagram name.

Not exposed in v1: `gitDiff` config (always omitted/disabled — see §3).

### 4.4 Diagram Generation & Viewing
- Same pipeline as `generateClassDiagramDirect` in
  `apps/vsextension/src/commands/generateClassDiagram.ts`, minus the
  VS Code-specific parts:
  1. Obtain the repo's source on the server (see §5.2) — fresh clone every
     time, no caching.
  2. `CodeParserService.parseWorkspace(path, config)`.
  3. Apply class-type / relationship-type filters (`GitDiffEnricher` is not
     invoked — git-diff is out of scope for v1).
  4. `DiagramGeneratorService.generateReactFlowData(diagramData)`.
  5. `ClassDiagramView.generate(nodes, edges, name, config, iconUri)` →
     HTML string rendered client-side (e.g. `<iframe srcDoc={...}>`).
- Clicking a class/member should open the corresponding file (and ideally
  line range) on GitHub in a new tab, since there's no local editor to jump
  to.

### 4.5 Multiple Diagrams per Repo (Views)
- A user can create and keep multiple named diagrams, scoped per
  repo + branch (e.g. "Backend services", "Frontend components").
- Equivalent of `ViewManager` (`packages/core/src/view/ViewManager.ts`), but
  backed by MongoDB Atlas instead of files under `.kratai/views/` — see §6.
- User can list, rename, delete, and re-generate saved diagrams; last-
  generated timestamp shown, matching the extension's tree view behavior.

### 4.6 Export as Markdown
- "Export as MD" produces the same output as
  `MarkdownExporter.toMarkdown(diagramData, diagramName)` and streams it
  straight to the user as a `.md` file download. Nothing is persisted
  server-side — unlike the extension's `.kratai/exports/` folder, there is
  no DB or blob-storage copy of exported markdown. Re-exporting means
  re-generating.

## 5. Architecture

### 5.1 Reused packages
- `@kratai/core` — parsing (`CodeParserService`, per-language parser
  strategies), enrichment (`EnricherRegistry` + framework enrichers),
  git-diff (`GitOperations`, `GitDiffEnricher`), export
  (`MarkdownExporter`), diagram data shaping (`DiagramGeneratorService`),
  config types (`KrataiConfig`), and the `ViewManager` domain model (its
  storage layer will be swapped for MongoDB — see §6 — but its concepts
  (`DiagramView`, `createView`/`listViews`/`updateView`/`deleteView`)
  should map directly to the web app's own persistence layer).
- `@kratai/viewer` — `ClassDiagramView` + box renderers, used unmodified to
  render the diagram HTML.
- Both packages assume Node.js `fs`/`child_process` are available (parsing
  reads real files off disk; git-diff shells out to the `git` CLI via
  `execSync`/`exec` — see `packages/core/src/git/gitOperations.ts`). This
  drives the hosting requirement in §5.3.

### 5.2 Code retrieval strategy: server-side clone
Because `@kratai/core` parses real files on disk and shells out to `git`,
the simplest way to reuse it unmodified is:
1. User authenticates with GitHub OAuth; the app gets a token scoped to
   read the selected repo.
2. On diagram generation (or first config load, to scan folders/
   extensions), the server does a **shallow clone** (`git clone --depth 1
   --branch <branch> <authenticated-url>`) of the selected repo/branch into
   an ephemeral working directory (e.g. `/tmp/<job-id>`).
3. `CodeParserService.parseWorkspace` and friends run against that local
   clone exactly as they do for the extension/desktop apps.
4. The clone is deleted after the job completes. No caching — every
   generation (including re-running a saved view, or scanning
   folders/extensions while configuring) re-clones from scratch.

This is the approach already sketched in `apps/web/package.json`'s
description and `apps/web/README.md`; this document treats it as the
intended design unless the user decides otherwise. Alternative (fetching
individual files via the GitHub Contents/Git Trees API instead of cloning)
was considered but rejected as a default because it would require
reimplementing filesystem-dependent parts of `@kratai/core`.

### 5.3 Hosting/runtime: Google Cloud Run + Cloud Build
**Decision:** deploy as a containerized Node.js service on **Google Cloud
Run**, built via **Cloud Build**. This satisfies what `@kratai/core` needs:
- Custom Docker image with the `git` binary installed (Cloud Run doesn't
  give you that by default — it has to be baked into the container image
  built by Cloud Build).
- A real Node.js runtime with `fs`/`child_process` available (not an
  edge/browser runtime) — Cloud Run runs arbitrary containers, so this is a
  non-issue as long as the image is Node-based.
- Writable ephemeral disk: Cloud Run containers get a writable in-memory
  `/tmp` (counts against the instance's configured memory) — clones go
  there and are deleted after the job (§5.2).
- Cloud Build handles CI: build the image on push/deploy and publish a new
  Cloud Run revision.

**Known constraint to keep in mind (not a v1 blocker, just a fact of this
platform):** Cloud Run enforces a per-request timeout (configurable, but
capped by the platform) and `/tmp` writes count against instance memory.
Since there's no app-level repo-size/time limit (see §3), a very large repo
could hit the platform's own request-timeout or memory ceiling before any
app-level guard would kick in. That's an accepted tradeoff for v1, not
something to build around now — revisit only if it actually bites.

### 5.4 High-level data flow
```
Browser                      Web Server (Node)                  External
--------                     ------------------                 --------
Sign in with GitHub  ─────▶  GitHub OAuth exchange  ───────────▶ GitHub
Pick repo/branch     ─────▶  List repos/branches    ───────────▶ GitHub API
Configure diagram    ─────▶  Scan extensions/folders
                              (shallow clone if needed) ───────▶ GitHub (git clone)
Generate diagram     ─────▶  parseWorkspace → enrich → filter
                              → generateReactFlowData
                              → ClassDiagramView.generate()
◀──── HTML/diagram data ──── 
Save view            ─────▶  Persist DiagramView doc  ───────▶  MongoDB Atlas
Export MD            ─────▶  MarkdownExporter.toMarkdown()
◀──── .md download ────────
```

## 6. Data Model (MongoDB Atlas)

**Decision: view configs are DB-backed only, not committed to git.**
The VS Code extension persists diagram configs as committed JSON in the
repo itself (`ViewManager` writes `.vscode/kratai/views.json` +
per-view config files — see `packages/core/src/view/ViewManager.ts:7-8`;
this very repo has examples at `.vscode/kratai/views.json` and
`.vscode/kratai/packages-architecture.json`). The web app deliberately
does **not** mirror this. Saving/editing a view here only ever writes to
MongoDB Atlas — it never commits or pushes to the user's repo. Rationale:
- Read-only OAuth scope is enough; no write/push access needed.
- Works for repos the user can only read (browsing OSS, a teammate's repo,
  etc.), not just ones they can push to.
- Avoids commit-flow complexity (target branch, conflicts with concurrent
  editors, commit noise).

Tradeoff accepted: web-created views are **not** visible to someone using
the VS Code extension on the same repo (no cross-tool parity), and they
disappear if the DB record is lost. Views should be able to be re-derived
from a `KrataiConfig` payload if we ever need a "commit this view to the
repo" opt-in later, so keep `config` self-contained and portable (i.e. no
web-only fields baked in that wouldn't also make sense in the extension's
`KrataiConfig`), but this is not a requirement for v1.

Minimum collections to support the flows above:

**`users`**
- GitHub user id, username, avatar, OAuth token/refresh info (encrypted at
  rest — see §8).

**`diagramViews`** (the DB equivalent of `ViewManager`'s per-workspace
`DiagramViewRegistry` + per-view config files)
- `userId`
- `repoFullName` (`owner/repo`)
- `branch`
- `name`
- `config` (a `KrataiConfig` document)
- `createdAt`, `lastGeneratedAt`

No cached diagram data or markdown is stored — re-opening a saved view
re-clones and re-parses from scratch (§3, §5.2).

Exact schema/indexes are an implementation detail; the requirement is that
views are scoped per user + repo + branch, mirroring how `ViewManager`
scopes views per workspace path today.

## 7. Feature Parity Matrix (extension vs web)

| Feature | VS Code extension | Web app |
|---|---|---|
| Source | Local workspace folder | Cloned GitHub repo/branch (server-side) |
| Config panel | `showConfigPanel.ts` webview | Equivalent web UI, same `KrataiConfig` knobs |
| Multiple saved diagrams | `ViewManager` (file-based, per workspace) | DB-backed (`diagramViews` in MongoDB Atlas), per user+repo+branch |
| Diagram rendering | `@kratai/viewer` in a VS Code webview | `@kratai/viewer` in a browser iframe |
| Click class → open source | Opens local file in editor | Opens file on GitHub (new tab) |
| Git diff highlighting | Local git working tree via `GitOperations` | Not supported (out of scope for v1) |
| Export as MD | Saved to `.kratai/exports/` in workspace | Downloaded directly to user; nothing stored server-side |
| AI integration (SKILL + local MCP server) | Yes | Not in scope for web v1 — exported MD file is the hand-off mechanism |

## 8. Security & Privacy

- GitHub OAuth tokens must be stored encrypted and only used server-side to
  perform the clone/API calls — never exposed to the browser.
- Minimize requested OAuth scopes to what's needed to read repo contents.
- Ephemeral clones must be cleaned up after use; no cross-user leakage of
  cloned source on shared infrastructure (each Cloud Run request/instance
  gets its own `/tmp`, but cleanup after each job is still required, not
  left to instance recycling).
- OAuth client secret and MongoDB Atlas connection string/credentials kept
  server-side only, sourced from Google Secret Manager (not baked into the
  container image or checked into the repo).
- Users should only ever see repos/branches they already have GitHub access
  to (enforced by using their own token for listing + cloning, not an app-
  wide token).

## 9. Decisions Made (v1)

All prior open questions have been resolved for v1 scope:

1. **Git-diff comparison** — out of scope entirely (§3, §4.3, §4.4). No
   diff semantics to design for now.
2. **Caching** — none. Every generation is a fresh clone + fresh parse
   (§5.2, §6).
3. **Export persistence** — direct download only; no DB/blob copy of
   exported markdown (§4.6).
4. **Hosting platform** — Google Cloud Run (containerized Node.js service,
   custom image with `git` installed) + Cloud Build for CI/image builds
   (§5.3).
5. **Repo size/time limits** — no app-level limit. The only ceiling is
   Cloud Run's own request-timeout/memory limits, which is a platform
   fact rather than a product decision (§5.3).
6. **Org/private repo access model** — plain GitHub OAuth only, no GitHub
   App / per-org installation flow, kept simple for v1 (§4.1).

## 10. Out of Scope (v1)

- Local MCP server / SKILL equivalent for the web app (the MD export is the
  hand-off to AI agents for now).
- Real-time multi-user collaboration on a saved diagram.
- Editing code from the web UI.
- Non-GitHub source providers (GitLab, Bitbucket, etc.).
- Git-diff / changed-lines visualization.
- GitHub App installation / fine-grained per-org permissions.
- Any server-side caching of clones, parsed diagram data, or exported
  markdown.
- Committing/pushing diagram configs back to the user's repo (views are
  DB-only — see §6).
