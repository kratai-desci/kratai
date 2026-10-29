// @kratai-desci/spec - everything about a project's Spec that does not need its code: the views
// (Spec document, Use Case Model, Data Model, Progress, the new-project wizard and the shell around
// them), the rules for progress and AI edits, the chat's spec tools, and reading uploaded documents.
// Shared by the desktop app (through @kratai/cli's view server) and the web app (kratai-web).

export * from './viewShell.js';
export * from './srsDocView.js';
export * from './docDiagramView.js';
export * from './useCaseDiagramView.js';
export * from './dataModelView.js';
export * from './progressView.js';
export * from './progressReportView.js';
export * from './progressData.js';
export * from './chatSpecTools.js';
export * from './chatActivity.js';
export * from './specSummary.js';
export * from './newProjectView.js';
export * from './documentText.js';
export * from './specApp.js';
export * from './tasks.js';
export * from './boardView.js';
