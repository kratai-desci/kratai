const { spawnSync } = require("node:child_process");

const result = spawnSync("npm", process.argv.slice(2), {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
