import db from "./controller/db.mjs";
import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
const collection = db.collection("data");
const coursesCollection = db.collection("courses");
const attendanceCollection = db.collection("attendance");

var jsonParser = bodyParser.json();
const saltRounds = 10;
const app = express();

app.use(jsonParser);

app.get("/", async (req, res) => {
  const cursor = collection.find({}).project({ password: 0 });
  const allValues = await cursor.toArray();
  res.status(200).json({ data: allValues });
});

app.post("/student/add", async (req, res) => {
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
  const resp = await collection.deleteOne({ roll_no: req.body.roll_no });
  res.status(200).json({ status: "OK" });
});

app.post("/login", async (req, res) => {
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

app.post("/student/get", async (req, res) => {
  const resp = await collection.findOne({ roll_no: req.body.roll_no });
  if (resp) {
    res.status(200).json({ data: resp });
  } else {
    res.status(404).json({ state: "Not Found" });
  }
});

app.post("/student/update", async (req, res) => {
  const resp = await collection.updateOne(
    {
      roll_no: req.body.roll_no,
    },
    {
      $set: {
        roll_no: req.body.roll_no,
        email_id: req.body.email_id,
        name: req.body.name,
        courses: req.body.courses,
      },
    }
  );
  res.status(200).json({ state: "OK" });
});

app.post("/courses/add", async (req, res) => {
  const resp = await coursesCollection.findOne({ c_id: req.body.c_id });
  if (resp) {
    res.status(500).json({ state: "failed" });
  } else {
    await coursesCollection.insertOne({ ...req.body, delivered: 0 });
    res.status(200).json({ state: "OK" });
  }
});

app.get("/courses", async (req, res) => {
  const resp = coursesCollection.find({});
  const response = await resp.toArray();
  res.status(200).json({ data: response });
});

app.post("/courses/get", async (req, res) => {
  const resp = coursesCollection.find({ c_id: { $in: req.body.courses } });
  const response = await resp.toArray();
  res.status(200).json({ data: response });
});

app.post("/courses/get/by-id", async (req, res) => {
  const resp = collection.find({
    courses: { $elemMatch: { $eq: req.body.c_id } },
  });
  const response = await resp.toArray();
  res.status(200).json({ data: response });
});

app.post("/attendance/save", async (req, res) => {
  const resp = await coursesCollection.findOne({ c_id: req.body.c_id });
  await coursesCollection.updateOne(
    { c_id: req.body.c_id },
    {
      $set: {
        delivered: resp.delivered + 1,
      },
    }
  );

  await attendanceCollection.insertOne({
    c_id: req.body.c_id,
    attendance: req.body.attendance,
  });

  res.status(200).json({ status: "inserted" });
});

app.listen(process.env.PORT, () => {
  console.log("Server listening");
});
