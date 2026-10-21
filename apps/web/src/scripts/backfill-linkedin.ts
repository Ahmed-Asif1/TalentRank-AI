import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";
import { extractLinkedInUrl } from "../lib/candidate-ui";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/?directConnection=true";
  const dbName = process.env.MONGODB_DB || "aicon";
  console.log("Connecting to MongoDB:", uri, "DB:", dbName);

  await mongoose.connect(uri, { dbName });
  const col = mongoose.connection.collection("items");
  const items = await col.find({}).toArray();

  let count = 0;
  for (const item of items) {
    const fullText = `${item.title || ""}\n${item.content || ""}`;
    const detected = item.sourceUrl || extractLinkedInUrl(fullText);

    if (detected && item.sourceUrl !== detected) {
      await col.updateOne({ _id: item._id }, { $set: { sourceUrl: detected } });
      console.log(`[UPDATED] ${item.title} -> ${detected}`);
      count++;
    } else if (item.sourceUrl) {
      console.log(`[ALREADY HAS URL] ${item.title} -> ${item.sourceUrl}`);
    } else {
      console.log(`[NO URL FOUND] ${item.title}`);
    }
  }

  console.log(`Done! Updated ${count} candidates with verified LinkedIn URLs.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
