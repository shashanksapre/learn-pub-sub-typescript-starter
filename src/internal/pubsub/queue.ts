import amqp, { type Channel } from "amqplib";

type SimpleQueueType = "Durable" | "Transient";

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  const channel = await conn.createChannel();
  const queue = await channel.assertQueue(queueName, {
    durable: queueType === "Durable",
    autoDelete: queueType === "Transient",
    exclusive: queueType === "Transient",
    arguments: undefined,
  });

  const replies = await channel.bindQueue(queueName, exchange, key);

  return [channel, queue];
}
