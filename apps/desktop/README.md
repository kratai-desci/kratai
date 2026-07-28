# @kratai/desktop (not implemented yet, much later)

Planned: Electron app. Main process `import`s `@kratai/core` directly against
the user's real local filesystem - zero network, zero cloning, same behavior
as the VS Code extension today. Renderer loads `@kratai/viewer`'s generated
HTML directly (`loadFile`/`loadURL`), no bundler needed given the viewer is
already a self-contained HTML/CSS/SVG/JS generator. Packaged with
electron-builder (Mac notarization, Windows signing, universal arm64+x64).

See the project conversation history for the full Electron vs. Tauri vs.
Flutter tradeoff discussion.
