const { IRabbitMQ } = require("../RFinal/class");
const Express = require("express");
const rabbitMQServer = "amqp://localhost:5672";
const app = Express();

const con = new IRabbitMQ();

app.get("/ping", async (req, res) => {
  await con.publisher("OIG-Q", { message: "ok" });
  const response = await con.getMessageCount("OIG-Q");
  res.send(response);
});
app.listen(5000, async () => {
  await con.subsriber("OIG-Q");
  const response = await con.getMessageCount("OIG-Q");
  console.log("connected to server 5000", response);
});
