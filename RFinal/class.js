const amqplib = require("amqplib");
const rabbitMQServer = "amqp://localhost:5672";

class IRabbitMQ {
  connection;
  channel;
  constructor() {
    this.init(rabbitMQServer);
  }

  async init(host) {
    try {
      const connection = await amqplib.connect(host);
      const channel = await connection.createChannel();
      channel.prefetch(1);
      this.connection = connection;
      this.channel = channel;
    } catch (err) {
      console.error(err);
    }
  }

  async publisher(queue, body) {
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(body)));
    console.log("msg sent ", body);
    await this.channel.close();
  }

  async subsriber(queue) {
    await this.init(rabbitMQServer);
    await this.channel.assertQueue(queue, { durable: true });
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
    await this.channel.consume(
      queue,
      async (msg) => {
        // custom function
      },
      { noAck: true }
    );
    await this.channel.close();
  }

  async getMessageCount(queue) {
    await this.init(rabbitMQServer);
    const response = await this.channel.checkQueue(queue);
    return response;
  }
}

module.exports = { IRabbitMQ };
