import { db } from "./lib/db";
import { riskAssessments, conjunctionEvents } from "./lib/db/schema";
import { sql } from "drizzle-orm";

async function run() {
  const riskCount = await db.select({ count: sql<number>`count(*)` }).from(riskAssessments);
  const conjCount = await db.select({ count: sql<number>`count(*)` }).from(conjunctionEvents);
  console.log("Risk Assessments count:", riskCount[0].count);
  console.log("Conjunction Events count:", conjCount[0].count);
  process.exit(0);
}
run();
