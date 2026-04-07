const mongoose = require("mongoose");
const { createClient } = require("redis");

const redisClient = createClient({ url: 'redis://redis:6379' });

// Connect to MongoDB with our safe connection pool
mongoose.connect("mongodb://mongo:27017/testdb", {
  maxPoolSize: 50,
});

const TestSchema = new mongoose.Schema({
  value: Number,
  timestamp: Number
});
const Test = mongoose.model("Test", TestSchema);

async function processQueue() {
  while (true) {
    try {
      // 1. Block and wait for an item from the right side of the queue
      const item = await redisClient.brPop('db_write_queue', 0);
      
      if (item) {
        const data = JSON.parse(item.element);
        
        // 2. Safely execute the database operations
        await Test.create({ value: data.value, timestamp: data.timestamp });
        await Test.findOne(); 
      }
    } catch (error) {
      console.error("Worker DB error:", error.message);
    }
  }
}

async function start() {
  await redisClient.connect();
  console.log("Worker connected to Redis. Processing queue...");
  
  // Start 50 concurrent loops to match our max DB pool size safely
  for(let i = 0; i < 50; i++) {
    processQueue();
  }
}
start();