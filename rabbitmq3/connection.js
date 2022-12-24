const amqp = require("amqplib");

let connection;

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect("amqp://localhost");
    console.log("connect to RabbitMQ success!");

    // How to reproduce "error" event?
    connection.on("error", function (err) {
      logger.error(err);
      setTimeout(connectRabbitMQ, 10000);
    });

    connection.on("close", function () {
      logger.error("connection to RabbitQM closed!");
      setTimeout(connectRabbitMQ, 10000);
    });
  } catch (err) {
    console.error(err);
    setTimeout(connectRabbitMQ, 10000);
  }
}
module.exports = { connectRabbitMQ };
