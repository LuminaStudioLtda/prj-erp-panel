import { existsSync } from "node:fs";

import EmbeddedPostgres from "embedded-postgres";

// PostgreSQL local de desenvolvimento. Os dados ficam em .postgres-data (ignorado pelo Git).
const databaseDir = ".postgres-data";
const database = "lumina";
const port = 5432;

const server = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

const isFirstRun = !existsSync(`${databaseDir}/PG_VERSION`);
if (isFirstRun) await server.initialise();
await server.start();
if (isFirstRun) await server.createDatabase(database);

console.log(
  `PostgreSQL pronto: postgresql://postgres:postgres@localhost:${port}/${database}`,
);

async function stop() {
  await server.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
