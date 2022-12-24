// connection variables
let amqp = require("amqplib/callback_api");
let amqpConn = null;
//start publisher variables
let pubChannel = null;
let offlinePubQueue = [];
async function start() {
  await amqp.connect("amqp://localhost:5672", function (err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
      return setTimeout(start, 1000);
    }
    conn.on("error", function (err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function () {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });
    console.log("[AMQP] connected");
    amqpConn = conn;
    whenConnected();
  });
}

async function whenConnected() {
  await startWorker();
  //   await startPublisher();
}

function startPublisher() {
  amqpConn.createConfirmChannel(function (err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function (err) {
      console.error("[AMQP] channel error", err.message);
    });
    ch.on("close", function () {
      console.log("[AMQP] channel closed");
    });

    pubChannel = ch;
    while (true) {
      let [exchange, routingKey, content] = offlinePubQueue.shift();
      publish(exchange, routingKey, content);
    }
    //     setInterval(() => {
    //       console.log("Clearing offlinePubQueue");
    //       if (offlinePubQueue.length) {
    //         let [exchange, routingKey, content] = offlinePubQueue.shift();
    //         publish(exchange, routingKey, content);
    //       }
    //     }, 1000);
  });
}

function publish(exchange, routingKey, content) {
  try {
    pubChannel.publish(
      exchange,
      routingKey,
      content,
      { persistent: true },
      function (err, ok) {
        if (err) {
          console.error("[AMQP] publish", err);
          offlinePubQueue.push([exchange, routingKey, content]);
          pubChannel.connection.close();
        }
      }
    );
  } catch (e) {
    console.error("[AMQP] publish", e.message);
    offlinePubQueue.push([exchange, routingKey, content]);
  }
}

function startWorker() {
  ch.consume("jobs", processMsg, { noAck: false });
  amqpConn.createChannel(function (err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function (err) {
      console.error("[AMQP] channel error", err.message);
    });
    ch.on("close", function () {
      console.log("[AMQP] channel closed");
    });
    ch.prefetch(10);
    ch.assertQueue("jobs", { durable: true }, function (err, _ok) {
      if (closeOnErr(err)) return;
      console.log("Worker is started");
    });
  });
}

function processMsg(msg) {
  work(msg, function (ok) {
    try {
      if (ok) ch.ack(msg);
      else ch.reject(msg, true);
    } catch (e) {
      closeOnErr(e);
    }
  });
}

function work(msg, cb) {
  console.log("PDF processing of ", msg.content.toString());
  cb(true);
}

function closeOnErr(err) {
  if (!err) return false;
  console.error("[AMQP] error", err);
  amqpConn.close();
  return true;
}

setInterval(async function () {
  await startPublisher();
  publish("", "jobs", Buffer.from("work work work"));
}, 1000);

start();
