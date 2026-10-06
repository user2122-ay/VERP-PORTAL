import { MongoClient } from "mongodb";
const p = global._m || (global._m = new MongoClient(process.env.MONGODB_URI).connect());
export const db = async () => (await p).db("verp");
