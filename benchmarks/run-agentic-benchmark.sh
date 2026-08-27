#!/usr/bin/env bash
#
# Runs one (repo, ticket, condition, run) iteration of the kratai efficiency
# benchmark, mirroring the ponytail methodology: a headless Claude Code
# session works a ticket against a real repo, with vs. without the tool
# wired in, scored on the diff it leaves behind. Requires the `claude` CLI
# on PATH and authenticated - this script does not work inside a sandbox
# that doesn't expose it (see benchmarks/README.md).
#
# Usage:
#   ./run-agentic-benchmark.sh <source_repo> <ticket_file> <with-skill|with-skill-prompted|with-skill-forced|baseline|ponytail> <run_id> <out_dir>
#
# Example:
#   ./run-agentic-benchmark.sh \
#     ~/bench-repos/full-stack-fastapi-template \
#     tickets/small-fastapi-template/001-add-verified-flag.md \
#     with-skill run1 \
#     results/small-fastapi-template/001/with-skill
#
# PONYTAIL_LEVEL (env var, default "full") sets the intensity used for the
# `ponytail` condition - lite | full | ultra.
#
# Three genuinely different with-skill variants, never to be averaged
# together or mistaken for each other:
#   with-skill          - the agent has kratai available and the SKILL
#                          instructs it to use it; whether it actually
#                          complies is part of what's measured, since that's
#                          what a real user experiences. Found to trigger
#                          unreliably (2 of 3 runs so far never invoked it
#                          at all) - see benchmarks/README.md.
#   with-skill-prompted  - same setup, but the ticket text itself also
#                          explicitly tells the agent to use kratai's tools
#                          (structure/detail/search), on top of whatever the
#                          SKILL alone would have prompted. Isolates "does
#                          kratai help when actually used" from "does it
#                          reliably self-trigger" - two different questions.
#                          Still on-demand tool use, agent's own judgment on
#                          when/what to look up - NOT the same as -forced.
#   with-skill-forced    - pre-runs `kratai analyze` during setup
#                          (deterministic, no LLM tokens) and injects its
#                          full output via --append-system-prompt,
#                          guaranteeing the content is present regardless of
#                          agent behavior. An idealized upper bound on
#                          having the content, not a realistic measurement -
#                          empirically the most expensive variant so far.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v claude >/dev/null 2>&1; then
	echo "error: 'claude' CLI not found on PATH - this script must run somewhere it's installed (e.g. your own terminal, not a restricted sandbox)." >&2
	exit 1
fi

# uv's default install/cache location (~/.local/share/uv) turned out to be
# owned by root on the machine this was developed on - not a sandbox
# artifact, a real, standing permission problem on that actual machine,
# most likely left behind by some earlier `sudo` command. Rather than push
# the user toward `sudo chown`-ing their own home directory just to run a
# benchmark script, redirect uv to a location this harness controls and
# knows is writable. Exported (not just set) so the agent's own subprocess
# - and anything IT shells out to, like `uv sync`/`uv run` during the
# actual ticket - inherits it too, not just this pre-flight step.
export UV_PYTHON_INSTALL_DIR="$SCRIPT_DIR/.uv-cache/python"
export UV_CACHE_DIR="$SCRIPT_DIR/.uv-cache/cache"
mkdir -p "$UV_PYTHON_INSTALL_DIR" "$UV_CACHE_DIR"

# Ensure the Python version the target repo actually requires is available
# via uv *before* the timed agent session starts, rather than letting an
# agent discover it's missing mid-session. Real incident this guards
# against: full-stack-fastapi-template's pyproject.toml requires
# Python >=3.14 (its api/deps.py deliberately uses a 3.14-only except-clause
# syntax), and one run's throwaway environment never got 3.14 actually
# provisioned - the agent hit a genuine SyntaxError on every request,
# couldn't diagnose why, and spent most of a 119-turn session convinced
# something was "tampering" with its fix. Condition-agnostic (every
# condition runs the same backend code) and repo-agnostic (a no-op if `uv`
# isn't on PATH, so this doesn't break future non-Python repo tiers). Cached
# under this harness's own controlled directory now, so this is a one-time
# cost across every future run, not per-invocation.
if command -v uv >/dev/null 2>&1; then
	if ! uv python list --only-installed 2>/dev/null | grep -q "3.14"; then
		echo "Ensuring Python 3.14 is available via uv (one-time, cached for future runs)..."
		uv python install 3.14 || echo "warning: uv python install 3.14 failed - steps needing 3.14 later may fail with a confusing error instead of this clear one" >&2
	fi
fi

SOURCE_REPO=$1
TICKET_FILE=$2
CONDITION=$3   # with-skill | with-skill-prompted | with-skill-forced | baseline | ponytail
RUN_ID=$4
OUT_DIR=$5
PONYTAIL_LEVEL="${PONYTAIL_LEVEL:-full}"

KRATAI_CLI="${KRATAI_CLI:-$SCRIPT_DIR/../packages/cli/out/cli.mjs}"

case "$CONDITION" in
	with-skill|with-skill-prompted|with-skill-forced|baseline|ponytail) ;;
	*)
		echo "error: condition must be 'with-skill', 'with-skill-prompted', 'with-skill-forced', 'baseline', or 'ponytail', got '$CONDITION'" >&2
		exit 1
		;;
esac

mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"
WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

# Fresh throwaway copy per run so conditions/runs never contaminate each
# other or the pristine source clone.
cp -R "$SOURCE_REPO"/. "$WORKDIR"/
cd "$WORKDIR"
rm -rf .git

# Ponytail's mode is a GLOBAL, machine-wide setting (~/.config/ponytail/
# config.json), unlike kratai's setup which only affects a run if `kratai
# init` wrote its files into THIS specific throwaway directory. Once
# ponytail is installed, it silently applies to every claude session on this
# machine regardless of which condition we're trying to measure - so unlike
# kratai, we can't rely on "didn't set it up in this workdir" to keep it out
# of with-skill/baseline runs. Force its state explicitly before every run,
# for every condition, rather than trust whatever was left over from
# whatever ran last: "off" for with-skill/baseline so it can't leak into a
# condition it's not part of, and PONYTAIL_LEVEL for the ponytail condition
# itself so the comparison uses a deliberate, known setting. This is a real
# `claude -p` call (ponytail has no plain-CLI equivalent to kratai's `kratai
# init`), so it has its own small token cost, tracked separately from the
# ticket run - check its is_error/result before trusting the run that follows.
#
# Checked via its own state file rather than just firing the /ponytail call
# and trusting `claude` to fail gracefully if the plugin isn't installed -
# that failure mode isn't verified, so don't rely on it. baseline/with-skill
# simply have nothing to force off if ponytail isn't there; the `ponytail`
# condition itself fails loudly instead of silently running without it.
PONYTAIL_INSTALLED=false
[ -f "$HOME/.config/ponytail/config.json" ] && PONYTAIL_INSTALLED=true

if [ "$CONDITION" = "ponytail" ] && [ "$PONYTAIL_INSTALLED" = false ]; then
	echo "error: condition 'ponytail' requested but ponytail doesn't appear to be installed (no ~/.config/ponytail/config.json) - install it first (see benchmarks/README.md)" >&2
	exit 1
fi

if [ "$PONYTAIL_INSTALLED" = true ]; then
	PONYTAIL_TARGET="off"
	[ "$CONDITION" = "ponytail" ] && PONYTAIL_TARGET="$PONYTAIL_LEVEL"
	claude -p "/ponytail $PONYTAIL_TARGET" \
		--output-format json \
		--permission-mode bypassPermissions \
		>"$OUT_DIR/$RUN_ID.ponytail-mode.json" 2>&1 || true
fi

# `kratai init` (below) writes its own setup files (SKILL.md, AGENTS.md,
# kratai.config.json, a .gitignore entry for kratai.local.json) - it has to
# run BEFORE the baseline commit, not after, so those become part of the
# baseline itself. Committing first and running init second (the original
# order here) left init's .gitignore edit sitting uncommitted, so the final
# `git diff` against baseline picked it up as if the agent had made that
# change during the ticket - it hadn't; that was pure harness setup noise.
FORCED_CONTEXT_ARGS=()
if [ "$CONDITION" = "with-skill" ] || [ "$CONDITION" = "with-skill-prompted" ] || [ "$CONDITION" = "with-skill-forced" ]; then
	if [ ! -f "$KRATAI_CLI" ]; then
		echo "error: kratai CLI not found at $KRATAI_CLI - build it first (npm run build --workspace=packages/cli)" >&2
		exit 1
	fi
	node "$KRATAI_CLI" init . >/dev/null

	# The SKILL (just written by `kratai init` above) instructs the agent to
	# run `npx @kratai/cli analyze` as its mandatory first step - but
	# @kratai/cli isn't published to npm (confirmed: registry lookup 404s),
	# so without this, npx would try and fail to fetch it from the registry
	# inside this throwaway workdir, and every with-skill run so far has been
	# silently unable to follow that instruction. Symlinking the already-built
	# package into this workdir's own node_modules makes npx resolve it
	# locally - no registry hit, no dependency on a prior global `npm link`.
	KRATAI_PKG_DIR="$(cd "$(dirname "$KRATAI_CLI")/.." && pwd)"
	mkdir -p node_modules/@kratai node_modules/.bin
	ln -sf "$KRATAI_PKG_DIR" node_modules/@kratai/cli
	ln -sf ../@kratai/cli/out/cli.mjs node_modules/.bin/kratai

	if [ "$CONDITION" = "with-skill-forced" ]; then
		# Deterministic, non-LLM call - costs nothing, unlike ponytail's
		# mode-set above. Written outside the git-tracked workdir (into
		# $OUT_DIR, where it's also kept as a permanent record of exactly
		# what was injected) so it can never leak into the measured diff.
		node "$KRATAI_CLI" analyze . -o "$OUT_DIR/$RUN_ID.kratai-analysis.md" >/dev/null
		FORCED_CONTEXT_ARGS=(--append-system-prompt "$(cat "$OUT_DIR/$RUN_ID.kratai-analysis.md")")
	fi
fi

git init -q
git add -A
git commit -q -m "baseline" --allow-empty

TICKET_TEXT=$(cat "$SCRIPT_DIR/$TICKET_FILE")

# with-skill-prompted's whole point: stand in for what SKILL auto-triggering
# was supposed to provide, made explicit instead of left to chance. Appended
# to the user-facing ticket text (not --append-system-prompt, which is
# reserved for -forced's full-content injection) since a real user plausibly
# would phrase a request this way - this is an instruction, not a content
# dump, and the agent still decides on its own when/what to look up.
#
# Revised (2026-08-26) after the first version only got light use - 2 kratai
# calls out of 64 Bash calls on ticket 002. Same instruction, strengthened
# with what each command does, why (token cost, stated plainly, not implied)
# and an explicit instead-of - not a new condition, since the goal is a
# better version of the same experiment, not a fourth thing to track.
# Deliberately still leaves reading the exact file you're about to edit
# intact: kratai replaces blind exploration, not the read Edit requires.
#
# Revised again (2026-08-26) after run2: the agent ran `npm view @kratai/cli`
# as a sanity check, got a real 404 (it's genuinely not published - that's
# expected, local symlink resolution is what makes it work, not the
# registry), and abandoned kratai entirely without ever trying the command
# that actually works. Explicitly preempting that exact reasoning trap here,
# not fixing it at the reliability/publishing level - per instruction, we're
# forcing a clean measurement first and deferring reliability work until we
# know there's something worth being reliable about.
if [ "$CONDITION" = "with-skill-prompted" ]; then
	TICKET_TEXT="$TICKET_TEXT

Before you start, run \`npx --no-install @kratai/cli structure\` - a fast, deterministic outline of every file/class/method in this codebase, no LLM cost to generate. Note: @kratai/cli is intentionally not published to the public npm registry - it resolves through a local package link already set up in this project. Do not run \`npm view\`/\`npm info\` to check first; that will show a 404 and is expected, not a sign it's broken. Just run the command directly - it has been verified to work. Then, as you work, use \`npx --no-install @kratai/cli detail <name-or-file>\` for a specific class or file's full properties/methods/relationships, and \`npx --no-install @kratai/cli search <name>\` to find something by name. Use these as your primary way to understand this codebase, not Read or Grep - a kratai lookup costs far fewer tokens than reading raw files or grepping around to figure out where something is. Only read a file directly once you already know, from kratai, that it's the one you need to edit."
fi

START_TS=$(date +%s)

# --output-format json gets you structured usage (input/output tokens, cost,
# turns, duration) in the final result message - that's what makes the
# numbers auditable instead of self-reported.
#
# --permission-mode acceptEdits (the original choice here) only auto-grants
# file-edit permission - it still prompts for Bash, and a headless -p session
# has no human to answer that prompt, so every Bash call (including the
# ticket's own required `uv run bash scripts/lint.sh` verification step)
# silently failed in every run of the first pilot batch. Confirmed by every
# run's permission_denials array being non-empty and all denials being that
# same Bash command, retried 5-15 times per run before the agent gave up -
# that retry-count noise, not real strategy variance, was driving most of the
# turn/cost/time spread in the first 4-run batch. bypassPermissions skips
# permission checks entirely (edits and Bash both), which is what a fully
# unattended run actually needs. Verify after your first run under this
# script that the result JSON's permission_denials array is empty - if your
# installed claude CLI version spells this flag differently, `claude -p
# --help` has the current name.
# Split into two calls rather than expanding FORCED_CONTEXT_ARGS[@] directly
# in one call: macOS ships bash 3.2 (/bin/bash, unchanged since 2007) as
# `bash` on PATH, and that version throws "unbound variable" under `set -u`
# when expanding an EMPTY array's [@] - even though it was explicitly
# declared - a bug bash 4+ doesn't have. Only touching [@] in the branch
# where it's known to be non-empty sidesteps the bug entirely.
if [ "${#FORCED_CONTEXT_ARGS[@]}" -eq 0 ]; then
	claude -p "$TICKET_TEXT" \
		--output-format json \
		--permission-mode bypassPermissions \
		>"$OUT_DIR/$RUN_ID.json"
else
	claude -p "$TICKET_TEXT" \
		--output-format json \
		--permission-mode bypassPermissions \
		"${FORCED_CONTEXT_ARGS[@]}" \
		>"$OUT_DIR/$RUN_ID.json"
fi

END_TS=$(date +%s)
# Plain `git diff` compares the working tree against the index and is blind
# to brand-new files the agent created but never `git add`ed itself (e.g. a
# new Alembic migration file) - they'd silently vanish from the recorded
# diff. Stage everything first, then diff the index against the baseline
# commit, so new files, modifications, and deletions all show up.
git add -A
git diff --cached >"$OUT_DIR/$RUN_ID.diff"
echo "wall_clock_seconds: $((END_TS - START_TS))" >"$OUT_DIR/$RUN_ID.meta"

echo "done: $OUT_DIR/$RUN_ID.{json,diff,meta}"
