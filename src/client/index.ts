import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind } from "../internal/pubsub/queue.js";

const CONN_STRING = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril client...");

  const conn = await amqp.connect(CONN_STRING);
  console.log("connected to RabbitMQ");

  const publishCh = await conn.createConfirmChannel();

  try {
    await publishJSON(publishCh, ExchangePerilDirect, PauseKey, {
      isPaused: true,
    });
  } catch (err) {
    console.error("Error publishing message:", err);
  }

  const username = await clientWelcome();

  await declareAndBind(
    conn,
    ExchangePerilDirect,
    `${PauseKey}.${username}`,
    PauseKey,
    "Transient"
  );

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
