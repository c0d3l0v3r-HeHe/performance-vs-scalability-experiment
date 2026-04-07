const express = require("express");
const mongoose = require("mongoose");
const os = require("os");

const app = express();

// Mongo with connection pool limit
mongoose.connect("mongodb://mongo:27017/testdb", {
  maxPoolSize: 50,
});

const TestSchema = new mongoose.Schema({
  value: Number,
});

const Test = mongoose.model("Test", TestSchema);

app.get("/", async (req, res) => {
  const start = Date.now();

  try {
    await Test.create({ value: Math.random() });
    await Test.findOne();

    const latency = Date.now() - start;

    res.json({
      latency,
      server: os.hostname(), // This will prove which container handled the request
    });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

app.listen(3000, () => console.log(`Server running on ${os.hostname()}`));