/**
 * Mock LinkedIn Scraper Script
 * 
 * This script simulates a data scraping operation (like from LinkedIn) 
 * by defining a mock candidate profile and sending it to our API endpoint 
 * for ingestion into the database.
 * 
 * Usage: npx ts-node apps/web/src/scripts/scraper-mock.ts
 * (Ensure the local development server is running on port 3000 before executing)
 */

// Define the API endpoint for ingesting the candidate data
const API_URL = 'http://localhost:3000/api/items';

// Define a mock candidate profile as it might be structured after scraping
const mockCandidate = {
  // A generic item structure that can be stored in the database
  name: 'Jane Doe Profile',
  description: 'Senior Software Engineer at TechCorp',
  url: 'https://linkedin.com/in/janedoe-mock',
  content: JSON.stringify({
    fullName: 'Jane Doe',
    headline: 'Senior Software Engineer at TechCorp',
    location: 'San Francisco Bay Area',
    about: 'Passionate software engineer with 10+ years of experience in full-stack development, specializing in React and Node.js.',
    experience: [
      {
        company: 'TechCorp',
        title: 'Senior Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        description: 'Lead developer for the core platform architecture.'
      },
      {
        company: 'WebSolutions Inc',
        title: 'Software Engineer',
        startDate: '2016-05',
        endDate: '2019-12',
        description: 'Developed scalable web applications for various clients.'
      }
    ],
    education: [
      {
        school: 'University of California, Berkeley',
        degree: 'Bachelor of Science in Computer Science',
        year: '2016'
      }
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'GraphQL', 'AWS']
  }),
  metadata: {
    source: 'linkedin_mock_scraper',
    scrapedAt: new Date().toISOString(),
    type: 'candidate_profile'
  }
};

/**
 * Main execution function
 * 
 * Sends a POST request to the API with the mock candidate data.
 */
async function runMockScraper() {
  console.log(`[Mock Scraper] Initializing...`);
  console.log(`[Mock Scraper] Scraped profile for Jane Doe`);
  console.log(`[Mock Scraper] Attempting to ingest data to ${API_URL}...`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: adjust the body if your API expects a different structure.
      body: JSON.stringify(mockCandidate),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log(`[Mock Scraper] Success! Data ingested successfully.`);
      console.log(`[Mock Scraper] API Response:`, responseData);
    } else {
      console.error(`[Mock Scraper] Error: API request failed with status ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Mock Scraper] Error details:`, errorText);
    }
  } catch (error) {
    console.error(`[Mock Scraper] Network error or server is unreachable.`);
    console.error(`[Mock Scraper] Ensure the development server is running at http://localhost:3000.`);
    console.error(error);
  }
}

// Execute the main function
runMockScraper();
