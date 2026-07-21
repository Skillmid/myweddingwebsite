const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
let db;
let memoryStore = [];

if (uri) {
    const client = new MongoClient(uri, { family: 4 });
    client.connect()
        .then(() => {
            db = client.db("weddingDB");
            console.log("Connected to MongoDB Atlas successfully!");
        })
        .catch((err) => {
            console.warn("MongoDB Atlas offline/restricted network. Falling back to local memory storage for testing.");
        });
}

app.post("/api/rsvp", async (req, res) => {
    const newRsvp = req.body;
    try {
        if (db) {
            const rsvpsCollection = db.collection("rsvps");
            await rsvpsCollection.insertOne(newRsvp);
        } else {
            memoryStore.push(newRsvp);
        }
        res.status(200).json({ message: "RSVP saved successfully" });
    } catch (err) {
        console.error("Failed to save RSVP:", err);
        memoryStore.push(newRsvp);
        res.status(200).json({ message: "RSVP saved successfully (fallback mode)" });
    }
});

app.get("/api/rsvps", async (req, res) => {
    try {
        if (db) {
            const rsvpsCollection = db.collection("rsvps");
            const allRsvps = await rsvpsCollection.find({}).toArray();
            return res.status(200).json(allRsvps);
        }
        res.status(200).json(memoryStore);
    } catch (err) {
        res.status(200).json(memoryStore);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
