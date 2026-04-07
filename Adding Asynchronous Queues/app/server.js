const express = require("express");
const { createClient } = require("redis");
const os = require("os");

const app = express();

// Connect to the Redis Queue
const redisClient = createClient({ url: 'redis://redis:6379' });
redisClient.on('error', err => console.error('Redis Error', err));

app.get("/", async (req, res) => {
  const start = Date.now();

  try {
    // 1. Create a data payload
    const payload = JSON.stringify({
      value: Math.random(),
      timestamp: Date.now()
    });

    // 2. Push it to the back of the queue (Left Push)
    await redisClient.lPush('db_write_queue', payload);

    const latency = Date.now() - start;

    // 3. Immediately return 202 Accepted (Eventual Consistency)
    res.status(202).json({
      latency,
      status: "queued",
      server: os.hostname(),
    });
  } catch (err) {
    res.status(500).json({ error: "Queue unavailable" });
  }
});

async function start() {
  await redisClient.connect();
  app.listen(3000, () => console.log(`Web Server running on ${os.hostname()}`));
}
start();