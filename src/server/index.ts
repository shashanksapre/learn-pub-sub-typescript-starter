import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";

const CONN_STRING = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril server...");

  const conn = await amqp.connect(CONN_STRING);
  console.log("connected to RabbitMQ");

  const publishCh = await conn.createConfirmChannel();

  const exchange = await publishCh.assertExchange(
    ExchangePerilDirect,
    "direct",
    {}
  );

  printServerHelp();

  while (1) {
    try {
      const inputs = await getInput("$$$@PR3 > ");
      if (inputs.length == 0) {
        continue;
      }
      if (inputs[0] === "pause") {
        console.log("Sending a pause...");
        await publishJSON(publishCh, exchange.exchange, PauseKey, {
          isPaused: true,
        });
      } else if (inputs[0] === "resume") {
        console.log("Sending a resume...");
        await publishJSON(publishCh, exchange.exchange, PauseKey, {
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
