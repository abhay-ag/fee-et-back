import { MongoClient } from "mongodb";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@studentdata.7y31v3b.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
let conn;
try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}
let db = conn.db("student");
export default db;
