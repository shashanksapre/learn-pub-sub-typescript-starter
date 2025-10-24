import amqp from "amqplib";

const CONN_STRING = "amqp://guest:guest@localhost:5672/";

async function main() {
  console.log("Starting Peril server...");

  const conn = await amqp.connect(CONN_STRING);
  console.log("connected to RabbitMQ");
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
