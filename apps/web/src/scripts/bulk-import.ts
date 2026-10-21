import fs from 'fs';
import path from 'path';

const candidatesFile = path.resolve(process.cwd(), 'candidates.txt');

interface Result {
  url: string;
  status: 'Success' | 'Failure';
  error?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!fs.existsSync(candidatesFile)) {
    console.error(`File not found: ${candidatesFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(candidatesFile, 'utf-8');
  const urls = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  console.log(`\n🚀 Found ${urls.length} URLs to process. Starting import...\n`);

  const results: Result[] = [];

  for (const url of urls) {
    console.log(`Processing: ${url}`);
    try {
      const response = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      results.push({ url, status: 'Success', error: '-' });
      console.log(`✅ Success: ${url}`);
    } catch (error: any) {
      results.push({ url, status: 'Failure', error: error.message || 'Unknown error' });
      console.error(`❌ Failure: ${url} - ${error.message || 'Unknown error'}`);
    }

    // Deliberate 2-second delay to avoid rate limits
    await delay(2000);
  }

  console.log('\n======================================================');
  console.log('                    IMPORT SUMMARY                    ');
  console.log('======================================================');
  console.table(results, ['url', 'status', 'error']);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('An unexpected error occurred:', err);
});
