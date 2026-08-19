// Copies the shared SKILL.md (source of truth: packages/skill) into this
// extension's own skills/ folder, at the exact path the "chatSkills"
// contribution point in package.json and krataiChatParticipant.ts already
// expect - so neither needs to know the file now lives in a shared package.
const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'skill', 'SKILL.md');
const destDir = path.join(__dirname, 'skills', 'kratai');

if (!fs.existsSync(srcFile)) {
	console.error('[copy-skill] packages/skill/SKILL.md not found.');
	process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(srcFile, path.join(destDir, 'SKILL.md'));
console.log('[copy-skill] copied SKILL.md');
