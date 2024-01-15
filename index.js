const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@studentdata.7y31v3b.mongodb.net/?retryWrites=true&w=majority`;

var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const bcrypt = require("bcrypt");
const saltRounds = 10;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const express = require("express");
const app = express();

app.use(jsonParser);

app.get("/", async (req, res) => {
  await client.connect();
  const db = client.db("student");
  const collection = db.collection("data");
  const cursor = collection.find({}).project({ password: 0 });
  const allValues = await cursor.toArray();
  res.status(200).json({ data: allValues });
});

app.post("/student/add", async (req, res) => {
  await client.connect();
  const db = client.db("student");
  const collection = db.collection("data");
  const exist = await collection.findOne({ roll_no: req.body.roll_no });
  if (exist) {
    res.status(500).json({ status: "Duplicate Students" });
  } else {
    let hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const resp = await collection.insertOne({
      ...req.body,
      password: hashedPassword,
    });

    if (resp.acknowledged) {
      res.status(200).json({ status: "OK" });
    }
  }
});

app.post("/student/delete", async (req, res) => {
  await client.connect();
  const db = client.db("student");
  const collection = db.collection("data");
  const resp = await collection.deleteOne({ roll_no: req.body.roll_no });
  res.status(200).json({ status: "OK" });
});

app.post("/login", async (req, res) => {
  await client.connect();
  const db = client.db("student");
  const collection = db.collection("data");
  const resp = await collection.findOne({ roll_no: req.body.roll_no });
  if (
    resp.password &&
    (await bcrypt.compare(req.body.password, resp.password))
  ) {
    res.status(200).json({ status: "OK" });
  } else {
    res.status(500).json({ status: "No id found" });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server listening");
});
