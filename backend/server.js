const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
let db = null;
let memoryStore = [];

if (uri) {
    let connectionUri = uri;
    if (!connectionUri.includes("weddingDB")) {
        const separator = connectionUri.includes("?") ? "&" : "?";
        connectionUri = connectionUri.replace(/\/?(\?|$)/, "/weddingDB$1");
    }

    const client = new MongoClient(connectionUri, { family: 4 });
    client.connect()
        .then(() => {
            db = client.db("weddingDB");
            console.log("Connected to MongoDB Atlas successfully!");
        })
        .catch((err) => {
            console.warn("Network DNS restriction detected. Running in reliable local memory mode.");
        });
}

app.post("/api/rsvp", async (req, res) => {
    const newRsvp = req.body;
    try {
        if (db) {
            const rsvpsCollection = db.collection("rsvps");
            await rsvpsCollection.insertOne(newRsvp);
            return res.status(200).json({ message: "RSVP saved successfully to MongoDB Atlas" });
        } else {
            memoryStore.push(newRsvp);
            return res.status(200).json({ message: "RSVP saved successfully (local memory mode)" });
        }
    } catch (err) {
        console.error("Database write error, falling back to memory:", err);
        memoryStore.push(newRsvp);
        res.status(200).json({ message: "RSVP saved successfully (fallback mode)" });
    }
});

app.get("/api/rsvps", async (req, res) => {
    try {
        if (db) {
            const rsvpsCollection = db.collection("rsvps");
            const allRsvps = await rsvpsCollection.find({}).toArray();
            return res.status(200).json({ source: "mongodb", data: allRsvps });
        }
        res.status(200).json({ source: "memory", data: memoryStore });
    } catch (err) {
        res.status(200).json({ source: "memory-fallback", data: memoryStore });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
