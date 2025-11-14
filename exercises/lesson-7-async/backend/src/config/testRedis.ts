import { Queue } from "bullmq";
import { redisConnection } from "./redis";

async function testRedis() {
  const testQueue = new Queue("test", { connection: redisConnection });

  try {
    await testQueue.add("test-job", { message: "Hello Redis!" });
    console.log("✅ Redis connection successful!");

    const jobs = await testQueue.getJobs(["waiting"]);
    console.log(`Jobs in queue: ${jobs.length}`);

    await testQueue.obliterate({ force: true });
    console.log("✅ Test queue cleaned up");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  } finally {
    await testQueue.close();
  }
}

testRedis();
