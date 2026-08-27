# kratai efficiency benchmark

Tests the one claim in the README that currently has no reproducible backing:
that giving an agent kratai's architecture context (`kratai init` + the SKILL)
makes it more token/time/cost-efficient on real coding tasks than working from
raw file reads alone.

Methodology mirrors [ponytail's benchmark](https://github.com/DietrichGebert/ponytail)
(the one credible example found among comparable projects - see
`benchmarks/results/` once populated for the audit trail Graphify's README
notably lacks): a headless Claude Code session works a fixed, pre-written
ticket against a real open-source repo, with vs. without kratai wired in,
scored on the `git diff` it leaves behind - not on self-reported logs.

There's now a third condition, `ponytail`, so the harness also runs the same
ticket with ponytail's plugin active instead of kratai - useful as a sanity
check against the closest comparable project, not just kratai-vs-nothing.

## Why this can't run inside a restricted sandbox

`run-agentic-benchmark.sh` shells out to the `claude` CLI in `-p
--output-format json` mode to get real, structured usage numbers (input/output
tokens, cost, turns) per run - that's what makes a result auditable instead of
an estimate. A sandboxed Claude Code session (like the one that wrote this
harness) doesn't have that CLI on `PATH` and can't fake the numbers without
becoming exactly the kind of unverifiable claim this benchmark exists to
avoid. Run it from a terminal where `claude` is installed and authenticated.

## Repos

| Tier | Repo | Notes |
|---|---|---|
| Small | [tiangolo/full-stack-fastapi-template](https://github.com/tiangolo/full-stack-fastapi-template) | Python (FastAPI/SQLModel) + TypeScript/React, MIT. Exercises the cross-language HTTP parser. |
| Medium | [nestjs/nest](https://github.com/nestjs/nest) | TypeScript, MIT. Deep DI/module/service/controller OOP structure. Not yet ticketed. |
| Large | [laravel/framework](https://github.com/laravel/framework) | PHP, MIT. Only PHP-parser coverage in the set. Not yet ticketed. |

## Running a single iteration

```bash
git clone --depth 1 https://github.com/tiangolo/full-stack-fastapi-template.git ~/bench-repos/full-stack-fastapi-template

npm run build --workspace=packages/cli   # from the kratai repo root, once

./run-agentic-benchmark.sh \
  ~/bench-repos/full-stack-fastapi-template \
  tickets/small-fastapi-template/001-add-verified-flag.md \
  with-skill run1 \
  results/small-fastapi-template/001/with-skill

./run-agentic-benchmark.sh \
  ~/bench-repos/full-stack-fastapi-template \
  tickets/small-fastapi-template/001-add-verified-flag.md \
  baseline run1 \
  results/small-fastapi-template/001/baseline

# requires ponytail already installed (via Claude Code's plugin system,
# separately from this repo - see the ponytail entry below) and PONYTAIL_LEVEL
# defaults to "full"; set it to override, e.g. PONYTAIL_LEVEL=lite
./run-agentic-benchmark.sh \
  ~/bench-repos/full-stack-fastapi-template \
  tickets/small-fastapi-template/001-add-verified-flag.md \
  ponytail run1 \
  results/small-fastapi-template/001/ponytail
```

## Fixed so far (chronological, all on ticket 001)

- **`kratai init` ran after the baseline commit**, not before, so its own
  `.gitignore` edit (adding `kratai.local.json`) sat uncommitted and got
  swept into the `with-skill` condition's final `git diff` - looking like an
  unrelated file the agent had touched, when it was pure harness setup noise.
  Fixed by running `kratai init` (when applicable) *before* the baseline
  commit, so its output is part of the baseline, not the diff.
- **The ticket's test requirement was ambiguous** ("don't add tests unless
  repo convention already includes them"), which let one condition add three
  tests matching the repo's existing pattern and the other add none - and
  that gap accounted for nearly all of the "efficiency" difference between
  them in that run, once the diffs were actually read side by side. Fixed by
  spelling out the exact three test cases required (superuser success, 404,
  permission-denied) in the ticket, matching `test_users.py`'s existing
  pattern, so both conditions are held to the identical bar.
- **The diff-capture step used plain `git diff`**, which is blind to
  brand-new files the agent creates but never `git add`s itself - the
  required Alembic migration file was silently absent from every diff
  because of this, not because either condition skipped it. Fixed by
  staging everything first: `git add -A && git diff --cached`.
- **`--permission-mode acceptEdits` only grants file-edit permission, not
  Bash** - and a headless `-p` session has no human to answer a Bash
  permission prompt, so every single run of the first full 4-run batch
  (2026-08-25) silently failed every attempt at the ticket's own required
  verification step (`uv run bash scripts/lint.sh`), retrying 5-15 times
  before giving up. That retry-count noise - not real strategy variance -
  was driving most of the turn/cost/time spread across those 4 runs, and
  none of them ever actually got lint/tests to run. **That entire batch is
  invalid**, archived at `results/small-fastapi-template/001-invalid-permission-bug/`
  for reference, not as data to average into anything. Fixed by switching to
  `--permission-mode bypassPermissions`, which skips permission checks
  entirely - appropriate here since there's no human in the loop to prompt
  regardless. Verify your own installed CLI accepts this flag name (`claude
  -p --help`) and that a fresh run's `permission_denials` array comes back
  empty before trusting any numbers from it.
- **`npx @kratai/cli analyze` - the exact command the SKILL tells the agent
  to run as its mandatory first step - could never have worked in any
  `with-skill` run collected so far.** `@kratai/cli` isn't published to npm
  (confirmed via the registry API: 404), and `kratai init` only writes
  `SKILL.md`/`AGENTS.md`/`kratai.config.json` into the workdir - it never
  makes the package itself resolvable there. So every `with-skill` session
  has been getting an instruction it couldn't literally follow; what an
  agent does after a mandatory first step fails is undefined and would vary
  run to run, which is a very plausible extra source of the noise seen
  across every batch so far, on top of the permission bug above. **The
  post-permission-fix batch (`run1`, one pair) is invalidated for this
  reason** and archived at
  `results/small-fastapi-template/001-invalid-no-npx-resolution/`. Fixed by
  symlinking the already-built package into each `with-skill` workdir's own
  `node_modules` (`node_modules/@kratai/cli` -> the built package,
  `node_modules/.bin/kratai` -> its `cli.mjs`) right after `kratai init`, so
  `npx` resolves it locally with no registry hit and no dependency on a
  prior global `npm link`. Verified directly (outside any `claude` session):
  `npx @kratai/cli analyze` against a throwaway directory set up this way
  resolves and runs correctly, exit code 0. Not yet verified end-to-end
  inside an actual agent session - confirm the next `with-skill` run's
  transcript/result shows it actually ran `kratai analyze` before trusting
  its numbers.
- **Added a third condition, `ponytail`.** Unlike kratai, ponytail has no
  plain-CLI setup step - it's installed once via Claude Code's plugin system
  (`/plugin marketplace add DietrichGebert/ponytail` then `/plugin install
  ponytail@ponytail`, done manually, outside this repo) and its mode lives in
  a GLOBAL, machine-wide file (`~/.config/ponytail/config.json`), not
  anything scoped to a project directory the way `kratai.config.json` is.
  That means once installed, it silently applies to every `claude` session on
  the machine unless explicitly told otherwise - a `with-skill` or `baseline`
  run collected after installing it would otherwise secretly have ponytail
  active too, contaminating both of those conditions, not just adding a
  third. The harness now sends an explicit `claude -p "/ponytail <state>"`
  call before every run of every condition - `off` for `with-skill`/
  `baseline`, `$PONYTAIL_LEVEL` (default `full`) for `ponytail` - recorded
  separately as `<run>.ponytail-mode.json`. This is a real `claude` call
  (ponytail has no free, non-LLM equivalent to `kratai init`), so it has its
  own small token cost on every run, tracked apart from the ticket itself.
  **Not yet verified**: whether `/ponytail <state>` sent via headless `-p`
  actually takes effect the same way it does interactively - check
  `<run>.ponytail-mode.json`'s `result` field confirms the mode change
  before trusting anything about a `ponytail` run, or a `with-skill`/
  `baseline` run collected after ponytail was installed.
- **`"${FORCED_CONTEXT_ARGS[@]}"` threw "unbound variable" under `set -u`
  when the array was empty**, on macOS specifically - `/bin/bash` there is
  version 3.2 (unchanged since 2007, licensing reasons), and 3.2 has a real
  bug expanding an empty array's `[@]` under `set -u` that bash 4+ doesn't
  have. Reproduced directly on that exact bash version, not assumed. Fixed
  by only touching `[@]` in the branch where the array is known non-empty
  (`if [ "${#FORCED_CONTEXT_ARGS[@]}" -eq 0 ]; then ... else ... fi`) instead
  of the version-dependent expansion. Worth remembering for any future array
  use in this script - `${#arr[@]}` (length) is safe on both bash versions,
  `"${arr[@]}"` (expansion) is only safe on 4+.
- **The ponytail mode-forcing step assumed ponytail is always installed** -
  once you uninstall it (see `/ponytail off` vs. full removal above), every
  `baseline`/`with-skill` run would fail too, not just `ponytail`, since
  there'd be nothing to force off. Fixed by checking for ponytail's own
  state file (`~/.config/ponytail/config.json`) first: `baseline`/
  `with-skill` simply skip the forcing step if it's not there (nothing to
  force off), while the `ponytail` condition itself fails loudly instead of
  silently running without ponytail actually active.
- **A `with-skill` run can complete successfully, verify its own work, and
  never invoke kratai at all - `permission_denials`/`is_error` being clean
  proves nothing about whether the SKILL was actually used.** Found by
  reading the real persisted session transcript (`~/.claude/projects/
  <hashed-workdir>/<session_id>.jsonl` - survives even though the ephemeral
  workdir itself gets deleted) instead of trusting the summary JSON: one
  `with-skill` run (2026-08-26) made 31 Bash calls and zero of them touched
  kratai - it explored with `find`/`ls`/`grep`/`Read` instead. Checked
  precisely (not just "no mention of kratai"): the skill *was* correctly
  registered and listed as available (`skill_listing` block, `"names":
  ["kratai",...]`, matching its frontmatter description) - `kratai init`'s
  setup mechanism worked. But zero phrases unique to the SKILL's actual body
  ("Session Start", "High Cohesion", "npx @kratai/cli") appear anywhere, so
  the model was shown kratai as an option and never invoked it - a
  triggering failure, not a setup failure, and not something "The ladder"/
  "YAGNI" text can be used to detect, since ponytail's skill uses near-
  identical phrasing for its own unrelated ladder concept. **Before
  trusting any `with-skill` run's numbers, grep its transcript for
  SKILL-body-unique phrases, not just check that the run succeeded.**
- **A `with-skill-prompted` run on ticket 002 (2026-08-26) looked like a
  genuine efficiency disaster (119 turns, $4.36) - it wasn't about kratai at
  all.** full-stack-fastapi-template's `pyproject.toml` requires Python
  `>=3.14` (`api/deps.py` deliberately uses a 3.14-only unparenthesized
  `except A, B:` clause). The agent's throwaway environment never got 3.14
  actually installed, hit a genuine `SyntaxError` on every request, couldn't
  diagnose why, and confabulated a dramatic story about a "tampered" `ruff`
  and a hidden instruction to stay silent about it - almost certainly not a
  real security incident, just an LLM narrativizing an unresolved
  environment failure it never correctly diagnosed. Root cause, verified
  independently rather than trusting either agent's self-report: `uv`'s
  default install location (`~/.local/share/uv`) turned out to be owned by
  `root` on the machine this was developed on - a real, standing permission
  problem (probably left behind by some earlier `sudo` command), not a
  sandbox artifact. Confirmed the fix end-to-end: `uv run python3 -c
  "import ast; ast.parse(open('app/api/deps.py').read())"` failed before,
  parses cleanly after. Fixed by redirecting `UV_PYTHON_INSTALL_DIR`/
  `UV_CACHE_DIR` to `benchmarks/.uv-cache/` (gitignored, ~280MB) and
  pre-installing 3.14 there before the timed session starts, rather than
  pushing the user toward `sudo chown`-ing their own home directory just to
  run a benchmark script. Exported, so the agent's own `uv` calls during the
  ticket inherit the fix too, not just this pre-flight step. **Any run
  collected before this fix that touches `deps.py` or requires the backend
  to actually start up should be treated as possibly affected**, not
  trusted at face value - this includes the ticket 002 `with-skill-prompted`
  run above.

## What's still missing before this produces a citable number

- **Only one ticket exists** (`001-add-verified-flag.md`). ponytail used 12;
  a single ticket is a smoke test for the harness, not a benchmark.
- **n=1 valid pair so far** (`with-skill`/`baseline` run1, collected after
  both the permission-mode and npx-resolution fixes above - see
  `results/small-fastapi-template/001/`). Every earlier batch was
  invalidated; nothing before that run1 pair should be averaged into
  anything. No valid `ponytail` runs yet. Run each condition at least 4x
  (per ponytail's own precedent) before trusting the spread - single runs in
  this project's own history have swung from -50% to +38% on the same
  metric, so anything under n=4 is not signal.
- **No automated correctness gate.** Reading each pair of diffs by hand
  works at n=1 but won't scale, and can't substitute for actually running
  the repo's own lint/test commands (see the ticket's "Definition of done") -
  which the permission-mode bug above shows this harness hasn't actually
  been able to do yet. Once `bypassPermissions` is confirmed working, check
  whether the agent's own lint/test run inside each session passed, not just
  whether the diff looks right on inspection.
- **Medium/large tiers have no tickets yet** (nestjs/nest, laravel/framework).
