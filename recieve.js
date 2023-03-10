var amqp = require("amqplib/callback_api");

amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    var queue = "q1";

    channel.assertQueue(queue, {
      durable: false,
    });

    channel.purgeQueue(queue, [
      async (err, ok) => {
        if (err) {
          throw err;
        }
      },
    ]);
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

    channel.consume(
      queue,
      function (msg) {
        console.log(" [x] Received " + msg.content.toString());
      },
      {
        noAck: true,
      }
    );
  });
});
