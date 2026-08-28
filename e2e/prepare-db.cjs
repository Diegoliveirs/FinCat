const { spawnSync } = require("node:child_process");

if (!process.env.DATABASE_URL?.startsWith("postgres")) {
  throw new Error("DATABASE_URL deve apontar para um banco PostgreSQL exclusivo do Playwright");
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
for (const script of ["db:migrate", "db:bootstrap"]) {
  const result = spawnSync(npm, ["run", script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
