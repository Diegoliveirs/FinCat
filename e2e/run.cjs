const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("O servidor E2E não ficou disponível a tempo");
}

async function main() {
  const database = path.join(".impeccable", "e2e", `fincat-${Date.now()}.db`);
  const env = { ...process.env, DATABASE_URL: database, FINCAT_E2E_DATABASE: database };
  fs.mkdirSync(path.dirname(path.resolve(database)), { recursive: true });
  const prepared = spawnSync(process.execPath, ["e2e/prepare-db.cjs"], { cwd: process.cwd(), env, stdio: "inherit" });
  if (prepared.status !== 0) process.exit(prepared.status ?? 1);
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3201"],
    { cwd: process.cwd(), env, stdio: "ignore", windowsHide: true },
  );
  let result = 1;
  try {
    await waitForServer("http://127.0.0.1:3201", 120_000);
    const tests = spawnSync(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
      { cwd: process.cwd(), env, stdio: "inherit" },
    );
    result = tests.status ?? 1;
  } finally {
    if (server.pid)
      spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  }
  process.exit(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
