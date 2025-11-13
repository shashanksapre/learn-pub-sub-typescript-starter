import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { clientWelcome, getInput } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind } from "../internal/pubsub/queue.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";

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

  while (1) {
    try {
      const inputs = await getInput("$$$@PR3 > ");
      if (inputs.length == 0) {
        continue;
      }
      if (inputs[0] === "spawn") {
        console.log("Sending a pause...");
        commandSpawn()
      } else if (inputs[0] === "resume") {
        console.log("Sending a resume...");
        await publishJSON(publishCh, ExchangePerilDirect, PauseKey, {
          isPaused: false,
        });
      } else if (inputs[0] === "quit") {
        await conn.close();
        console.log("RabbitMQ connection closed.");
        console.log("shutting down...");
        process.exit(0);
      } else {
        console.log("What?");
      }
    } catch (err) {
      console.error("Error publishing message:", err);
    }
  }

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
