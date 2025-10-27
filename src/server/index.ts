import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publishJSON.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";

const CONN_STRING = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril server...");

  const conn = await amqp.connect(CONN_STRING);
  console.log("connected to RabbitMQ");

  const cCh = await conn.createConfirmChannel();

  await publishJSON(cCh, ExchangePerilDirect, PauseKey, { IsPaused: true });

  process.on("SIGINT", async () => {
    await conn.close();
    console.log("RabbitMQ connection closed.");
    console.log("shutting down...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
