# @kratai/web (not implemented yet)

Planned: Next.js app. GitHub OAuth (Auth.js), server-side clone + parse of the
selected repo/branch using `@kratai/core` (real Node runtime in API
routes/Server Actions, not a browser sandbox - `fs`/`child_process` work
unmodified), interactive diagram rendered via `@kratai/viewer`
(`<iframe srcDoc={...}>`), saved views persisted in a database (per user/repo,
unlike the file-based `ViewManager` persistence used by the desktop/extension
apps).

See the project conversation history for the full architecture discussion
(repo-cloning approach, hosting tradeoffs, DB/ORM choice).
