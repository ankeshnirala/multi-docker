import {
  redisHost,
  redisPort,
  sqlHost,
  sqlUser,
  sqlDatabase,
  sqlPassword,
  sqlPort,
} from "./keys.js";

import express from "express";
import redis from "redis";
import cors from "cors";
import { exit } from "process";
import { createConnection } from "mysql2/promise";

// APP SETUP
const app = express();
app.use(express.json());
app.use(cors());

//POSTGRES SETUP
const connection = createConnection({
  host: sqlHost,
  user: sqlUser,
  password: sqlPassword,
  database: sqlDatabase,
  port: sqlPort,
});

connection.then(async (result) => {
  const res = await result.query(
    "CREATE TABLE IF NOT EXISTS tests (number INT(11))"
  );

  if (res && res[0] && res[0].affectedRows == 1) {
    console.log("TABLE CREATED");
  } else if (res && res[0] && res[0].affectedRows == 0) {
    console.log("TABLE ALREADY CREATED");
  } else {
    console.log("TABLE NOT CREATED");
  }
});

connection.catch((err) => {
  console.log("DB connection lost!!");
  exit(0);
});

//REDIS CLIENT SETUP
const redisClient = redis.createClient({
  host: redisHost,
  port: redisPort,
  retry_strategy: () => 1000,
});

const redisPublisher = redisClient.duplicate();

// EXPRESS ROUTE HANDLER
app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  const response = await (await connection).query("SELECT * FROM tests;");
  res.send(response[0]);
});

app.get("/values/current", (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  redisClient.hset("values", index, "45");
  redisPublisher.publish("insert", index);

  const con = await connection;
  await con.query(`INSERT INTO tests(number) values(${parseInt(index)})`);
  res.send({ working: true });
});

app.listen(5000, () => {
  console.log("APP SERVER IS RUNNING ON PORT 5000");
});
