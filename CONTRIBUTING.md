# Contributing to kratai

Thanks for considering a contribution! This covers the legal agreement every
contribution requires, how to set up the repo, and how to submit a change.

## Contributor License Agreement (CLA)

Before we can accept any pull request, issue, or other contribution, you need
to agree to the [Contributor License Agreement](CLA.md).

In plain terms: submitting a contribution grants **Decentralized Science,
Inc** a license to use it — including relicensing it commercially or under a
proprietary license in the future, on top of kratai's open-source MIT
license. This keeps the project open-source now while leaving room to build
commercial offerings later without needing to track down every past
contributor for permission.

You don't need to sign anything separately — **opening a pull request means
you agree to the CLA**. If that's not something you're comfortable with,
please don't submit the PR; opening an issue to discuss the change first is
always fine, no CLA needed just to talk.

## Development setup

This is an npm workspaces monorepo.

```bash
git clone https://github.com/kratai-desci/kratai.git
cd kratai
npm install
npm run build   # builds every package
npm test        # runs @kratai/analysis's test suite
npm run lint    # lints every package
```

### Repository structure

```
packages/
├── analysis/      analysis engine + diagram-spec generator (deterministic, zero LLM calls)
├── diagram-view/  the interactive class diagram renderer, shared by cli and desktop
├── cli/           kratai analyze / kratai view - installable CLI, also exports runView as a library
└── desktop/       Electron desktop app - a native window around the same view server `kratai view` runs
```

Each package has its own `build`/`watch` script — see that package's
`package.json` for the exact commands.

## Making a change

1. Fork the repo and create a branch off `main`.
2. Make your change. Keep PRs focused — one change per PR is easier to review
   and merge than a bundle of unrelated fixes.
3. Run `npm run build` and `npm test` before opening the PR.
4. Open a pull request describing what changed and why.

## Reporting bugs / suggesting features

Open an [issue](https://github.com/kratai-desci/kratai/issues) or start a
[discussion](https://github.com/kratai-desci/kratai/discussions) — no CLA
needed just to report something.

## License

kratai is [MIT licensed](LICENSE). By contributing, you also agree to the
[CLA](CLA.md) above.
