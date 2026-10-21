import { LinkedInProfileScraper } from "linkedin-profile-scraper";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
  const cookie = process.env.LINKEDIN_SESSION_COOKIE;
  console.log("LINKEDIN_SESSION_COOKIE is set:", Boolean(cookie), "length:", cookie?.length);

  try {
    const scraper = new LinkedInProfileScraper({
      sessionCookieValue: cookie || "",
      keepAlive: false,
    });
    console.log("Instantiated successfully");
    await scraper.setup();
    console.log("Setup successfully");
  } catch (err: any) {
    console.error("Scraper Error:", err.message);
  }
}

test().catch(console.error);
