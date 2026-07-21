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

if (!uri) {
    console.error("Please define the MONGODB_URI environment variable inside .env");
} else {
    const client = new MongoClient(uri);
    client.connect()
        .then(() => {
            db = client.db("weddingDB");
            console.log("Connected to MongoDB Atlas successfully!");
        })
        .catch((err) => {
            console.error("MongoDB connection error:", err);
        });
}

app.post("/api/rsvp", async (req, res) => {
    const newRsvp = req.body;
    if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
    }
    try {
        const rsvpsCollection = db.collection("rsvps");
        await rsvpsCollection.insertOne(newRsvp);
        res.status(200).json({ message: "RSVP saved successfully" });
    } catch (err) {
        console.error("Failed to save RSVP:", err);
        res.status(500).json({ error: "Failed to save data to database" });
    }
});

app.get("/api/rsvps", async (req, res) => {
    if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
    }
    try {
        const rsvpsCollection = db.collection("rsvps");
        const allRsvps = await rsvpsCollection.find({}).toArray();
        res.status(200).json(allRsvps);
    } catch (err) {
        console.error("Failed to retrieve RSVPs:", err);
        res.status(500).json({ error: "Failed to retrieve data from database" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
