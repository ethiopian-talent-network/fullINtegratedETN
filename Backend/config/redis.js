// redisClient.js
const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    keepAlive: 5000,
    reconnectStrategy: (retries) => {
      console.log("Redis retry:", retries);
      return Math.min(retries * 100, 3000);
    },
  },
});

// Events
client.on("connect", () => console.log("✅ Redis connected"));
client.on("ready", () => console.log("🚀 Redis ready"));
client.on("error", (err) => console.error("❌ Redis error:", err));
client.on("end", () => console.log("⚠️ Redis connection closed"));
client.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));

// Connect once globally
async function connectRedis() {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
}

// Optional: safe keep-alive (with logging)
setInterval(async () => {
  try {
    if (client.isOpen) {
      await client.ping();
    }
  } catch (err) {
    console.error("Ping failed:", err);
  }
}, 10000);

module.exports = { client, connectRedis };