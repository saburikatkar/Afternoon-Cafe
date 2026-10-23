import app from "./app";
import { logger } from "./lib/logger";
import { initializeCafeData } from "./lib/initialize-cafe";

const rawPort = process.env["PORT"] ?? "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start(): Promise<void> {
  await initializeCafeData();
  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ host: "0.0.0.0", port }, "Server listening");
  });
  server.on("error", (error: Error) => {
    logger.error({ err: error, host: "0.0.0.0", port }, "Error listening on port");
    process.exit(1);
  });
}

void start().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to initialize Afternoons Cafe API");
  process.exit(1);
});
