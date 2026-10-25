const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const scripts = require("../package.json").scripts;
const results = [];
for (const [name, command] of Object.entries(scripts).filter(([name]) => name.startsWith("test:"))) {
  const started = Date.now();
  const result = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", command.replace(/^tsx /, "")], { encoding: "utf8", timeout: 300000 });
  results.push({ name, exitCode: result.status, durationMs: Date.now() - started, stdout: result.stdout, stderr: result.stderr, error: result.error?.message });
  console.log(`${name}: ${result.status === 0 ? "PASS" : "FAIL"}`);
  if (result.status !== 0) console.log(result.stdout + result.stderr);
}
fs.writeFileSync("docs/calendar-test-results.json", JSON.stringify(results, null, 2));
console.log(`${results.filter(result => result.exitCode === 0).length}/${results.length} suites passed`);
process.exitCode = results.every(result => result.exitCode === 0) ? 0 : 1;
