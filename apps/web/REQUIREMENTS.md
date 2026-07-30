# kratai Web App — Requirements

Status: v1 core flow implemented and in use (GitHub OAuth, repo/branch
picking, diagram generation + caching, saved views, MD export, MongoDB
Atlas persistence). Monetization (§9) is requirements-only, not yet built.
Scope: `apps/web`

## 1. Overview

A web version of kratai that lets a user connect their GitHub account, pick a
repo + branch, and generate the same interactive architecture diagram the
VS Code extension produces — without needing the repo checked out locally.
Diagrams can be saved (multiple per repo/branch, like the extension's saved
"views"), regenerated, and exported as a Markdown file for feeding into an AI
coding agent as architectural context.

This app is a workspace member (`apps/web`) in the existing npm workspaces
monorepo and reuses `packages/core` (parsing, enrichment, git-diff, export,
view model) and `packages/viewer` (diagram HTML rendering) as-is rather than
reimplementing that logic.

Internally, `apps/web/src` follows a layered architecture, encoded directly
in numbered top-level folders so the layer is obvious from the file tree:
`2_domain` (entity types + repository *interfaces* only, no logic),
`1_application` (all orchestration/business logic, Server Actions, queries),
`3_infrastructure` (mock and real implementations of the domain interfaces,
plus the composition points that pick between them based on what's
configured via env vars). Skip-layer calls (presentation → infrastructure)
are allowed for composition points; infrastructure never calls back into
application. This isn't re-documented in depth here — read the source, it's
small — but it's a real, load-bearing decision worth knowing before adding
new features: new capabilities should slot into this pattern (domain
interface → mock + real implementations → application orchestration), not
bypass it.

## 2. Goals

- Log in with GitHub OAuth. **Done.**
- List the user's accessible repos (or let them enter/search one) and pick a
  branch. **Done**, with lazy branch loading (branches for a repo are only
  fetched once that repo is selected, not eagerly for every repo in the
  list).
- Configure a diagram the same way the extension's config panel does:
  folder selection, file-extension selection, class-type filters,
  relationship-type filters, HTTP-call detection toggle, framework-
  enrichment toggle. (Git-diff visualization is out of scope for v1 — see
  §3.) **Done** — see §4.3 for how the folder tree/extension picker are
  populated cheaply, without a full parse, for a diagram that's never been
  generated yet.
- Generate the diagram and view it interactively in the browser (pan/zoom,
  click a class to jump to source — source jump opens the file on GitHub
  instead of a local editor). **Done.**
- Save multiple named diagrams ("views") per repo/branch, list them, re-run
  them, rename/delete them — same mental model as the extension's sidebar
  (Diagrams + Exports groups). **Done**, scoped per signed-in user (§6) —
  each saved view also shows its source commit (short sha, linked to GitHub)
  in the sidebar and dashboard card.
- Export the generated diagram as a `.md` file (same format as
  `MarkdownExporter.toMarkdown`) for the user to download and feed to an AI
  agent as architecture context. **Done**, reuses a cached parse when one
  exists instead of re-cloning (§5.2).
- Persist users' saved views in MongoDB Atlas. **Done.**
- **Not originally scoped, added during v1 build-out:** cache each view's
  generated diagram data so re-opening a saved view is instant instead of
  re-cloning and re-parsing every time, with clear staleness/regenerate UX.
  See §5.2 — this now supersedes the original "no caching" decision.

## 3. Non-Goals / Known Limitations

- **No local filesystem access.** Unlike the VS Code extension, the web app
  never reads a folder already on the user's machine. Every diagram is
  generated from a GitHub-hosted repo/branch the user has access to.
- Not building a general-purpose GitHub browser/IDE — just enough repo/branch
  picking to drive diagram generation.
- Real-time collaboration on a saved diagram is out of scope for v1 (sharing
  a saved diagram with another user is planned as a Pro-plan perk — see
  §9 — but not implemented; "coming soon" on the pricing page only).
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
- **No repo size or clone-depth limit** is enforced by the app itself
  (see §5.3 for the hosting platform's own timeout, which is a separate,
  real ceiling).
- **Clones themselves are never cached or reused** — every generation still
  does a fresh shallow clone into a temp dir, deleted after the job. What's
  now cached is the *parsed result* of that clone, not the clone itself
  (§5.2). This is a deliberate, narrower reversal of the original
  "no caching" stance, not a general caching layer.

## 4. User Flows

### 4.1 Authentication
- "Sign in with GitHub" (OAuth). **Implemented** via Auth.js (next-auth v5
  beta), GitHub provider, `read:user user:email repo` scope.
- **Session strategy: JWT, no database adapter.** The session (user id,
  username, access token) lives entirely in a signed cookie; Auth.js itself
  never writes a user/account row anywhere. There is currently **no
  persisted `users` collection at all** — `getCurrentUser()` decodes the
  session/JWT on every request rather than reading a database row. GitHub's
  numeric account id (from the JWT) is used as the `userId` foreign key on
  `diagramViews` (§6), but nothing about the user's profile is stored
  server-side. **This changes once monetization (§9) is built** — a plan
  needs somewhere durable to live, which means introducing a real `users`
  collection for the first time. That's called out again in §9 since it's a
  real, non-trivial consequence of that feature, not a detail.
- Plain GitHub OAuth (not a GitHub App) — kept simple for v1. Org-owned
  repos: accessible only to the extent the org allows third-party OAuth
  apps and the user has access — no per-org installation flow or
  fine-grained permissions (that's a GitHub App concern, explicitly
  deferred — see §3).
- After login, the user lands on a dashboard of their previously saved
  diagrams (if any) plus an entry point to create a new one. Unauthenticated
  visitors to any authenticated route are redirected to the landing page
  (only enforced once GitHub OAuth is actually configured via env vars —
  see §5.1; without it, the app runs entirely on mock data for local dev).

### 4.2 Repo & Branch Selection
- User picks a repo from their GitHub account (own repos + orgs they have
  access to, at minimum) and a branch within that repo. **Implemented.**
- Selecting a repo auto-scrolls the page to reveal the branch picker +
  Continue button (added after real usage showed users didn't notice the
  branch section below the fold).

### 4.3 Diagram Configuration (parity with extension's config panel)
Reference: `apps/vsextension/src/commands/showConfigPanel.ts`.

The web config UI offers the same knobs `KrataiConfig` exposes
(`packages/core/src/types/config/KrataiConfig.ts`):
- Folder tree with per-folder selection (`selectedFolders`).
- File extension selection (`selectedExtensions`), pre-populated from a scan
  of the repo.
- Class-type filters (class/interface/abstract/module/etc.).
- Relationship-type filters (extends/implements/calls/imports/http-call/
  etc.).
- HTTP call detection toggle (`detectHttpCalls`).
- Framework enrichment toggle (`frameworkEnrichment`) — Django/Next.js/
  Spring Boot enrichers already exist in `packages/core`.
- Diagram name.

Not exposed in v1: `gitDiff` config (always omitted/disabled — see §3).

**How the folder tree/extension picker are populated (important
implementation note, not just an aside):** building these two widgets only
ever needs each file's *path* and *extension* — not parsed classes or
relationships. Configuring a **brand-new** diagram (or editing a view that's
never been successfully generated) therefore uses a cheap file-listing scan
(`WorkspaceScanner.getFilesToParse` — a plain directory walk with
gitignore/extension filtering, no AST parsing) instead of a full parse. This
matters: a full parse (the original v1 behavior) took as long to *configure*
a diagram as to *generate* one, which was a real, reported bad-UX issue
("the app takes a very long time... just scanning stuff") before this fix.
Class-type/relationship-type filter options are genuinely not knowable from
a file listing alone, so for a never-generated diagram those two filter
sections show "Available after this diagram is generated once." instead of
options — editing the config *after* a first generation (which is cached,
§5.2) shows real, populated filter options, sourced from that cache with no
extra clone/parse needed.

### 4.4 Diagram Generation & Viewing
Same pipeline as `generateClassDiagramDirect` in
`apps/vsextension/src/commands/generateClassDiagram.ts`, minus the
VS Code-specific parts — `CodeParserService.parseWorkspace` → filter →
`DiagramGeneratorService.generateReactFlowData` →
`ClassDiagramView.generate()` → HTML rendered client-side in
`<iframe srcDoc={...}>`. `GitDiffEnricher` is not invoked (git-diff is out
of scope for v1 — see §3).

**Caching, staleness, and regeneration (added after v1's original "always
re-clone, always re-parse" design — see §5.2 for the full mechanics):**
- Opening an existing saved view renders its cached diagram **instantly** —
  no clone, no parse, no waiting, regardless of how long the original
  generation took.
- If the branch has new commits since the cached data was generated, a
  clearly-styled warning banner (fixed dark background + yellow text/icon in
  both light and dark theme, deliberately not the app's usual adaptive
  warning color, so it reads as "pay attention" rather than blending into
  either theme) appears with a "Regenerate" button. The stale diagram is
  still fully usable while that banner is showing.
- Regeneration **only ever starts from an explicit user action** — first
  generation of a brand-new view, an explicit "Regenerate" click, "Retry"
  after a failed generation, or "Save & regenerate" after editing config.
  Nothing regenerates automatically on page load. Rationale (the user's own
  framing, worth preserving): an unexpected wait when just opening a page is
  upsetting; a wait the user triggered themselves by clicking something is
  expected and tolerated. Never violate that ordering when extending this
  flow.
- Only one generation runs per view at a time, enforced by an atomic
  database status transition (not an in-process lock — see §5.2 for why
  that distinction matters on this hosting platform). If a second request
  tries to regenerate a view that's already generating, it doesn't start a
  second worker — it just shows the same "regenerating" state.
- The parse itself runs off the main request thread via `node:worker_threads`
  (§5.3.1) so one user's generation never blocks any other concurrent
  request on the same server instance.

Clicking a class/member opens the corresponding file (and line range) on
GitHub in a new tab, since there's no local editor to jump to.

### 4.5 Multiple Diagrams per Repo (Views)
- A user can create and keep multiple named diagrams, scoped per
  repo + branch (e.g. "Backend services", "Frontend components").
  **Implemented**, backed by MongoDB Atlas instead of `ViewManager`'s
  file-based storage — see §6.
- User can list, rename, delete, and re-generate saved diagrams; last-
  generated timestamp and source commit (short sha, linked to GitHub) shown
  per view.
- **Views are strictly scoped per signed-in user** — `userId` is a required
  parameter on every `ViewRepository` method (not just an optional filter),
  and every database query enforces it directly in the query itself (e.g.
  Mongo's `{ _id, userId }`), not as a post-fetch check. A user can never
  list, read, update, or delete a view that isn't theirs, even if they
  guess its id. This was tightened after an early build shared one global
  view list across every signed-in account regardless of who created what —
  worth stating explicitly here so it's never regressed.

### 4.6 Export as Markdown
"Export as MD" produces the same output as
`MarkdownExporter.toMarkdown(diagramData, diagramName)` and streams it
straight to the user as a `.md` file download. Reuses the view's cached
diagram data when available (§5.2) instead of re-cloning; falls back to a
fresh clone+parse only for a view that's never been generated. Nothing is
persisted server-side beyond that existing cache — unlike the extension's
`.kratai/exports/` folder, there is no separate DB or blob-storage copy of
exported markdown itself. Re-exporting after editing filters just re-runs
the export against the same cached data.

## 5. Architecture

### 5.1 Reused packages
- `@kratai/core` — parsing (`CodeParserService`, per-language parser
  strategies, `WorkspaceScanner`), enrichment (`EnricherRegistry` + framework
  enrichers), git-diff (`GitOperations`, `GitDiffEnricher` — unused by the
  web app, see §3), export (`MarkdownExporter`), diagram data shaping
  (`DiagramGeneratorService`), config types (`KrataiConfig`).
- `@kratai/viewer` — `ClassDiagramView` + box renderers, used unmodified to
  render the diagram HTML. Required one small fix to work outside a VS Code
  webview: the generated script now feature-detects `acquireVsCodeApi` and
  falls back to `window.parent.postMessage` when it's absent, so the same
  HTML works in a browser `<iframe>`.
- Both packages assume Node.js `fs`/`child_process` are available (parsing
  reads real files off disk; git cloning shells out to the `git` CLI). This
  drives the hosting requirement in §5.3. `next.config.ts` marks both
  packages `serverExternalPackages` so webpack leaves them external
  (required at runtime by Node instead of statically bundled) — needed
  because `@kratai/core`'s telemetry module does a scope-level
  `require.resolve('vscode')` that would otherwise fail the production
  build, and also keeps both packages out of the client bundle entirely
  (they're only ever imported from Server Components/Actions/Route
  Handlers).

### 5.2 Code retrieval strategy: server-side clone, cached parse result

Because `@kratai/core` parses real files on disk and shells out to `git`,
the simplest way to reuse it unmodified is a server-side shallow clone:

1. User authenticates with GitHub OAuth; the app gets a token scoped to
   read the selected repo.
2. On generation, the server does a shallow clone
   (`git clone --depth 1 --single-branch --branch <branch>
   <token-authenticated-url>`) of the selected repo/branch into an ephemeral
   temp directory.
3. `CodeParserService.parseWorkspace` runs against that local clone, off the
   main thread in a `node:worker_threads` worker (§5.3.1).
4. `git rev-parse HEAD` in the clone captures the exact commit that was
   parsed, before the clone is deleted.
5. The clone is deleted immediately after (step 3+4 complete). **The clone
   itself is never cached or reused** — every generation, including a
   user-triggered regeneration, re-clones from scratch. What *is* cached is
   the output of step 3: the parsed `DiagramData` (classes + relationships),
   stored on the view's MongoDB document alongside the commit sha from step
   4.

**Reading a saved view** does not repeat any of the above unless
regeneration is actually needed:
- If the view has a cached, ready `DiagramData`, it's rendered directly —
  no clone, no parse.
- Staleness (is there a newer commit than what's cached) is computed live
  on every read by comparing the stored commit sha against the branch's
  current head — a single lightweight GitHub API call
  (`GET /repos/{repo}/branches/{branch}`), not a stored flag that could
  drift out of sync. If that branch lookup fails (renamed/deleted branch),
  the view is treated as *not* stale rather than blocking/alarming the
  user — a missing signal shouldn't degrade the experience.
- Regeneration is guarded by an atomic status transition
  (`idle|ready|failed → generating`, and back) on the view's MongoDB
  document itself — specifically a single `findOneAndUpdate` where the
  "not already generating" check and the transition happen together. This
  has to be enforced at the database layer rather than with an in-process
  lock (e.g. a `Set` of in-flight view ids) because Cloud Run can run
  multiple instances of this service; an in-process lock on one instance is
  invisible to a request landing on a different instance. A `generating`
  status includes a timestamp; if it's older than a threshold (a crashed or
  recycled instance mid-generation), it's treated as stuck and eligible for
  a fresh attempt rather than wedging the view forever.
- A **failed regeneration** of a view that already had good cached data
  reverts status back to `ready` (keeping the last good `DiagramData`
  visible) rather than to `failed` — losing a working diagram because a
  *re*generation attempt failed would be worse than just showing slightly
  stale data with an error noted. Only a failed **first-ever** generation
  (nothing to fall back to) actually shows a failed/retry state.
- `listViews` (used by the dashboard/sidebar) explicitly excludes the cached
  `DiagramData` field from its query projection — it's a comparatively
  large payload, and listing views should never transfer every view's full
  cached parse just to render a list of names.

**Configuring** a diagram that's never been generated uses the cheap
file-listing scan described in §4.3, not this full pipeline.

Alternative approaches considered and rejected: fetching individual files
via the GitHub Contents/Git Trees API instead of cloning (would require
reimplementing filesystem-dependent parts of `@kratai/core`); a background
job/task queue for generation (Cloud Tasks, a DB-backed job table, a
polling UI) instead of the atomic-status-transition approach above —
deliberately not built, since the atomic transition + worker thread
combination solves the actual problems (blocking other users, double
generation) without needing separate job infrastructure; revisit only if
that combination turns out to be insufficient.

### 5.3 Hosting/runtime: Google Cloud Run + Cloud Build
**Decision:** deploy as a containerized Node.js service on **Google Cloud
Run**, built via **Cloud Build**. Not yet actually set up (no Dockerfile or
Cloud Build config exists in the repo yet) — this section documents the
intended target so it's not re-litigated when deployment work starts. This
satisfies what `@kratai/core` needs:
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

### 5.3.1 Parsing concurrency — **implemented**

**Problem:** `CodeParserService.parseWorkspace`
(`packages/core/src/parsing/codeParserService.ts`) parses files in a
synchronous, CPU-bound loop with no `await`s inside — for a large repo this
can occupy Node's single event loop for 30+ seconds, which would otherwise
freeze the *entire* server instance (every other concurrent user's
requests, not just the one generating the diagram) for that whole time.
`git clone` itself is async (`execFileAsync`) and was never the concern.

**Fix, as built:** the parse step runs in a Node `worker_threads` worker —
one worker per generation request, not a single shared worker (a shared
worker would just relocate the bottleneck without adding throughput). The
main thread stays free to serve all other requests no matter how long a
parse takes, and concurrent parses can run in genuine parallel across
multiple vCPUs. Deliberately **not** a job queue/background-task system —
see §5.2's "alternatives considered" note. This does not reduce the parse
time itself, only its blast radius on other users; combined with caching
(§5.2), most requests never pay the parse cost at all anymore, which
matters more in practice than shaving the worst case.

A real, separate bug was found and fixed while building this: the parsed
`ClassInfo` objects for JS module-level functions carried a
`_functionNodes` field holding raw, non-serializable TypeScript compiler AST
nodes internally — invisible on the main thread (nothing had ever tried to
serialize `DiagramData`), but fatal once it had to cross the
`postMessage` structured-clone boundary into/out of a worker. Fixed at the
source in `packages/core` (the field is now deleted right after its one
legitimate internal use), not worked around in `apps/web` — it's shared
logic, so a workaround here wouldn't have helped `apps/vsextension`.

**Deploy-time requirements, still pending** (nothing to do until the
Cloud Run/Dockerfile work in §5.3 actually happens, but don't forget then):
- `--cpu 2` or higher. Parallelism needs more than 1 vCPU — on a single
  vCPU, worker threads only fix responsiveness (main thread stays free),
  not throughput (concurrent parses still contend for the one core).
- `--concurrency` set well below the platform default of 80. CPU-bound work
  means you don't want dozens of requests piling onto one instance — cap it
  near however many concurrent parses that instance's vCPU count can
  actually sustain, and let Cloud Run spin up more instances instead.
- `--memory` raised alongside `--cpu`/`--concurrency` — each worker thread
  gets its own V8 heap (no shared memory by default), so memory scales with
  concurrent parses.
- Default CPU throttling behavior (CPU allocated only while a request is
  being processed) is fine as-is — no need for `--no-cpu-throttling`, since
  the worker's entire lifetime is inside the awaited request.
- Build-output gotcha: Next.js `output: 'standalone'` (not currently
  enabled — see §5.3) only ships files it can statically trace from
  imports; a `new Worker(runtimePath)` call with a computed path won't be
  picked up by that tracing. If standalone output is adopted, the worker
  script needs its own build step (compiled separately, not part of Next's
  page bundling), explicitly copied into the standalone output directory as
  a postbuild step, and referenced at runtime via an absolute path built
  from `process.cwd()`. Today, without standalone output, the worker script
  ships as-is alongside the rest of `src/`, so this doesn't apply yet.

### 5.4 High-level data flow
```
Browser                      Web Server (Node)                  External
--------                     ------------------                 --------
Sign in with GitHub  ─────▶  GitHub OAuth exchange  ───────────▶ GitHub
Pick repo/branch     ─────▶  List repos/branches    ───────────▶ GitHub API
Configure diagram    ─────▶  Scan file paths only
                              (cheap, no parse; cached
                              parse reused on edit)   ─────────▶ GitHub (git clone, new diagrams only)
Open saved view      ─────▶  Serve cached DiagramData  (no clone/parse if ready+unregenerated)
                              + live staleness check   ───────▶ GitHub (branch head sha only)
Regenerate (explicit ─────▶  Atomic status lock
click only)                   → clone → worker-thread parse
                               → cache result           ───────▶ GitHub (git clone)
◀──── HTML/diagram data ────
Save view            ─────▶  Persist DiagramView doc  ───────▶  MongoDB Atlas
Export MD            ─────▶  MarkdownExporter.toMarkdown() (cached data reused)
◀──── .md download ────────
```

## 6. Data Model (MongoDB Atlas)

**Decision: view configs are DB-backed only, not committed to git.**
The VS Code extension persists diagram configs as committed JSON in the
repo itself (`ViewManager` writes `.vscode/kratai/views.json` +
per-view config files). The web app deliberately does **not** mirror this.
Saving/editing a view here only ever writes to MongoDB Atlas — it never
commits or pushes to the user's repo. Rationale: read-only OAuth scope is
enough; works for repos the user can only read, not just push to; avoids
commit-flow complexity (target branch, conflicts, commit noise).

Tradeoff accepted: web-created views are **not** visible to someone using
the VS Code extension on the same repo, and they disappear if the DB record
is lost. `config` stays a self-contained, portable `KrataiConfig` payload
(no web-only fields baked in) in case a "commit this view to the repo"
opt-in is ever wanted later — not a v1 requirement.

**Collections, as actually implemented:**

**`diagramViews`**
- `userId` — GitHub account id (from the OAuth session's JWT — see §4.1).
  Required on every query; enforced in the query itself, not post-fetch
  (§4.5).
- `repoFullName` (`owner/repo`), `branch`, `name`, `config` (a `KrataiConfig`
  document).
- `createdAt`, `lastGenerated?` (set only once a generation actually
  succeeds).
- `status`: `'idle' | 'generating' | 'ready' | 'failed'` — see §5.2 for the
  state machine and the atomic transition guarantee.
- `commitSha?` — the commit `diagramData` was generated from, captured via
  `git rev-parse HEAD` right after cloning.
- `generatingSince?` — ISO timestamp, present only while `status ===
  'generating'`; used for the stuck-generation self-heal (§5.2).
- `lastError?` — message from the most recent failed generation attempt.
- `diagramData?` — the cached parse result (classes + relationships).
  Present once `status === 'ready'`. Excluded from `listViews`'s query
  projection (§5.2) — only fetched when actually needed (viewing, editing
  config, exporting).

**No `users` collection exists yet.** Identity is derived live from the
GitHub OAuth session on every request (§4.1) — there was never a reason to
persist a user record until now. **Monetization (§9) changes this**: plan
state needs a durable home, so building that feature means introducing a
real `users` collection for the first time, keyed by the same GitHub
account id already used as `diagramViews.userId`. That's a genuinely new
piece of infrastructure this app doesn't have today, not just a new field
on something that already exists — see §9 for the shape.

Exact schema/indexes beyond the above are an implementation detail; the
requirement is that views are scoped per user + repo + branch, and that the
generation-status transition is atomic at the database layer.

## 7. Feature Parity Matrix (extension vs web)

| Feature | VS Code extension | Web app |
|---|---|---|
| Source | Local workspace folder | Cloned GitHub repo/branch (server-side, ephemeral, never cached) |
| Config panel | `showConfigPanel.ts` webview | Equivalent web UI, same `KrataiConfig` knobs; cheap file-scan for a never-generated diagram (§4.3) |
| Multiple saved diagrams | `ViewManager` (file-based, per workspace) | DB-backed (`diagramViews` in MongoDB Atlas), per user+repo+branch, cached parse + staleness/regenerate (§5.2) |
| Diagram rendering | `@kratai/viewer` in a VS Code webview | `@kratai/viewer` in a browser iframe |
| Click class → open source | Opens local file in editor | Opens file on GitHub (new tab) |
| Git diff highlighting | Local git working tree via `GitOperations` | Not supported (out of scope for v1) |
| Export as MD | Saved to `.kratai/exports/` in workspace | Downloaded directly to user; reuses cached parse, nothing separately stored server-side |
| AI integration (SKILL + local MCP server) | Yes | Not in scope for web v1 — exported MD file is the hand-off mechanism |
| Pricing / plans | N/A (local tool) | Free (1 diagram) / Pro (unlimited + coming-soon perks) — planned, not built (§9) |

## 8. Security & Privacy

- GitHub OAuth tokens live only in the signed session JWT — never written to
  MongoDB, never exposed to the browser, used server-side only to perform
  clone/API calls (§4.1).
- Minimize requested OAuth scopes to what's needed to read repo contents.
- Ephemeral clones must be cleaned up after use; no cross-user leakage of
  cloned source on shared infrastructure (each Cloud Run request/instance
  gets its own `/tmp`, but cleanup after each job is still required, not
  left to instance recycling).
- OAuth client secret and MongoDB Atlas connection string/credentials kept
  server-side only, sourced from environment variables today (`.env.local`,
  gitignored); Google Secret Manager once actually deployed to Cloud Run
  (§5.3), not baked into the container image or checked into the repo.
- Users should only ever see repos/branches they already have GitHub access
  to (enforced by using their own token for listing + cloning, not an
  app-wide token), and only ever see/modify their own saved views, enforced
  at the database query level (§4.5) — not just hidden in the UI.

## 9. Monetization: Free & Pro Plans (planned, not yet implemented)

Adds a subscription model on top of the existing per-user view scoping
(§4.5): a **Free** plan and a **Pro** plan, gating how many diagrams a user
can save.

### 9.1 Plans

**Free** (default for every account, including all existing users once this
ships — see §9.4):
- At most **1** saved diagram view at a time. Creating a 2nd requires either
  deleting the existing one or upgrading to Pro — trying to create beyond
  the cap must fail clearly server-side (not just be discouraged in the
  UI), with a message directing the user to upgrade, since `createViewAction`
  is a Server Action a client could otherwise call directly.

**Pro** — **$5/month**, or **$30/year** as a limited-time promotional annual
price (50% off the $60/year a monthly-equivalent rate would imply). Exact
regular (non-promotional) annual price and the promotion's end date are not
yet decided — flag as an open question before building the pricing page's
copy, don't invent a number.
- **Unlimited saved diagram views.** This is the only perk that's actually
  functional at launch.
- **Share a saved diagram with another user** — listed on the pricing page
  as a Pro perk, marked **"coming soon."** Not designed or built; no data
  model, no access-control story yet. Do not imply it works anywhere in the
  UI outside the pricing page's marketing copy.
- **Desktop app access** — listed on the pricing page as a Pro perk, marked
  **"coming soon."** Refers to the `apps/desktop` app referenced as a future
  workspace member in `packages/core`'s own module header comment
  (`packages/core/src/index.ts`) — that app doesn't exist yet either. Same
  "coming soon" treatment as sharing.

### 9.2 Pricing page

A new public page presenting both plans side by side: Free (1 diagram) vs
Pro ($5/mo, or $30/yr shown as a discounted/promotional price relative to
the monthly-equivalent annual cost, with a visible "limited time" framing
so it doesn't read as the permanent price), with Pro's three perks listed
(unlimited diagrams — available now; share diagrams — coming soon; desktop
app access — coming soon), the two "coming soon" ones visually marked as
such (e.g. a badge), not presented as available today.

### 9.3 Enforcement point and data model consequence

The 1-diagram cap is a **server-side check** in `createViewAction`
(`1_application/actions.ts`), reading the current user's plan and their
existing view count before calling `viewRepository.createView`. This
requires a new **`users`** collection — see §6 — that doesn't exist today,
minimally:
- `_id` / `userId` — the GitHub account id, same identifier already used as
  `diagramViews.userId`.
- `plan`: `'free' | 'pro'`.
- Payment-processor-specific fields (customer id, subscription id,
  subscription status, current billing period end) — exact shape depends on
  the payment processor decision below.

**Payment processor: not yet decided.** Stripe is the obvious default for
this shape of product (fixed monthly/annual subscription, no marketplace or
multi-party payouts involved, well-trodden Next.js integration path via
Checkout + webhooks) and this document assumes it as a placeholder the same
way earlier sections assumed Cloud Run before that was fully settled — but
unlike Cloud Run, this hasn't been explicitly confirmed. Treat "Stripe" as
a stand-in until confirmed, not a locked decision.

### 9.4 Migration note

Existing users may already have more than 1 saved view from before this
plan existed. Enforcement must be **forward-only**: block creating new
views beyond the cap once a user is on the Free plan, but never retroactively
delete, hide, or lock a user's existing views just because they're over the
new limit. This follows the same non-destructive posture already used
elsewhere in this app (e.g. a failed regeneration never discards a view's
last good cached data — §5.2).

### 9.5 Explicitly out of scope for this feature (for now)

- Actually implementing the share-with-another-user or desktop-app-access
  perks — pricing-page copy only, per §9.1.
- Usage-based or seat-based billing, team/org accounts, invoicing.
- Any enforcement mechanism other than the single create-time check
  described in §9.3 (e.g. no periodic re-validation job, no grace-period
  logic beyond whatever the payment processor's own subscription-lifecycle
  webhooks imply).

## 10. Decisions Made

1. **Git-diff comparison** — out of scope entirely (§3, §4.3, §4.4). No
   diff semantics to design for now.
2. **Caching** — the parsed diagram result is cached per view in MongoDB,
   with live staleness detection and explicit user-triggered regeneration
   only; the underlying git clone itself is still never cached (§3, §5.2).
   This reverses the original v1 "no caching at all" decision after real
   usage showed re-parsing on every view was too slow to be usable.
3. **Parsing concurrency** — a `worker_threads` worker per generation
   request, not a job queue/background-task system (§5.3.1).
4. **Export persistence** — direct download only; no separate DB/blob copy
   of exported markdown beyond the diagram-data cache it's generated from
   (§4.6).
5. **Hosting platform** — Google Cloud Run (containerized Node.js service,
   custom image with `git` installed) + Cloud Build for CI/image builds
   (§5.3). Not yet actually deployed.
6. **Repo size/time limits** — no app-level limit. The only ceiling is
   Cloud Run's own request-timeout/memory limits, which is a platform
   fact rather than a product decision (§5.3).
7. **Org/private repo access model** — plain GitHub OAuth only, no GitHub
   App / per-org installation flow, kept simple for v1 (§4.1).
8. **Session/identity storage** — JWT session strategy, no database
   adapter, no persisted `users` collection for authentication itself
   (§4.1). Monetization (§9) introduces a `users` collection for plan
   state specifically — a narrower addition than a full auth-adapter
   migration.
9. **Monetization model** — Free (1 diagram) / Pro ($5/mo or $30/yr promo)
   as described in §9. Payment processor not yet confirmed (assumed
   Stripe).

## 11. Out of Scope (v1)

- Local MCP server / SKILL equivalent for the web app (the MD export is the
  hand-off to AI agents for now).
- Real-time multi-user collaboration on a saved diagram.
- Sharing a saved diagram with another user, and desktop app access — both
  advertised as "coming soon" Pro perks (§9.1) but not designed or built.
- Editing code from the web UI.
- Non-GitHub source providers (GitLab, Bitbucket, etc.).
- Git-diff / changed-lines visualization.
- GitHub App installation / fine-grained per-org permissions.
- Caching or reusing the git clone itself (only the parsed result is
  cached — §5.2).
- Committing/pushing diagram configs back to the user's repo (views are
  DB-only — see §6).
- Usage-based/seat-based billing, team or org accounts (§9.5).
