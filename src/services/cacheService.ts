// src/services/cacheService.ts

import { RedisUrl } from "@/config";
import { createClient } from "redis";

const redisClient = createClient({
  url: RedisUrl,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
})();

export const cacheService = {
  get: async (key: string) => {
    return await redisClient.get(key);
  },
  set: async (key: string, value: string, expirationInSeconds?: number) => {
    console.log(
      "Setting cache for key:",
      key,
      "with value:",
      value,
      "and expiration:",
      expirationInSeconds ? expirationInSeconds / 60 : "infinity",
      "minutes",
      "at",
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    );
    if (expirationInSeconds) {
      await redisClient.set(key, value, { EX: expirationInSeconds });
    } else {
      await redisClient.set(key, value);
    }
  },
  del: async (key: string) => {
    await redisClient.del(key);
  },
};
