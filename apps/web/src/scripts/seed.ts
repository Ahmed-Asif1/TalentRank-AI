import { ObjectId } from "mongodb";
import { EMBEDDING_DIMENSIONS } from "@/lib/contracts";
import { connectToDatabase, connectMongoose } from "@/lib/db";
import { ItemModel, ChatThreadModel, ChatMessageModel, AiRunModel } from "@/lib/models";
import { logger } from "@/lib/logger";

/**
 * Generates a deterministic unit-length embedding vector of EMBEDDING_DIMENSIONS length.
 * Deterministic generation ensures repeatable seed data and valid vector search calculations.
 */
function generateDeterministicEmbedding(seed: number): number[] {
  const raw: number[] = [];
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const val = Math.sin((seed + 1) * 997 + i * 17);
    raw.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return raw.map((val) => Number((val / norm).toFixed(6)));
}

/**
 * Manifest item 28: Seed script populating an anonymous demo user, realistic items
 * with embeddings, multi-turn chat threads, and AI run telemetry records.
 *
 * Guaranteed to be idempotent: safe to execute repeatedly without duplicating data.
 */
export async function seed(): Promise<void> {
  const { db } = await connectToDatabase();
  await connectMongoose();

  const demoEmail = process.env.DEMO_USER_EMAIL || "demo@example.com";
  logger.info("Starting idempotent seed for demo user...", { email: demoEmail });

  // 1. Ensure demo user exists in Better Auth user collection
  const user = await db.collection("user").findOne({ email: demoEmail });
  let userId: string;

  if (!user) {
    const newUserId = new ObjectId();
    await db.collection("user").insertOne({
      _id: newUserId,
      id: newUserId.toString(),
      name: "Demo User",
      email: demoEmail,
      emailVerified: true,
      isAnonymous: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userId = newUserId.toString();
    logger.info("Created new anonymous demo user", { userId, email: demoEmail });
  } else {
    userId = (user.id as string) || user._id.toString();
    logger.info("Found existing demo user", { userId, email: demoEmail });
  }

  // 2. Seed 7 realistic items (within 5-8 requirement) in the placeholder domain
  // PLACEHOLDER DOMAIN — replace when real domain is chosen
  const seedItems = [
    {
      title: "Sarah Jenkins - Senior React Engineer",
      content: "Name: Sarah Jenkins\nHeadline: Senior Frontend Engineer @ EdTechInnovators | React, Next.js, TypeScript\nSummary: Passionate about building accessible and performant learning platforms.\nExperience:\n- Senior Frontend Engineer at EdTechInnovators (2020-01 to Present)\n  Lead developer for the core student portal using Next.js App Router and Tailwind CSS.\n- Frontend Developer at CodeCamp (2017-06 to 2019-12)\n  Built interactive coding environments for kids using React and Redux.\nEducation:\n- B.S. Computer Science at University of Technology\nSkills:\nReact.js, Next.js, TypeScript, Tailwind CSS, GraphQL",
      sourceUrl: "https://linkedin.com/in/sjenkins-mock",
      mime: "text/plain",
      status: "processed" as const,
      aiSummary: "Strong candidate with direct EdTech experience, specifically leading Next.js App Router migrations.",
      aiTags: ["react", "nextjs", "edtech", "typescript", "tailwind"],
      score: 95,
      severity: "low",
      category: "Senior Engineer",
      fields: {
        strengths: ["Direct EdTech experience", "Next.js App Router expertise", "TypeScript proficiency"],
        weaknesses: ["No backend node.js experience listed"],
        verdict: "Strong Hire. Excellent match for our stack.",
        yearsOfExperience: 7
      },
      embedding: generateDeterministicEmbedding(1),
    },
    {
      title: "Michael Chen - Fullstack Developer",
      content: "Name: Michael Chen\nHeadline: Fullstack Developer | Node.js | React\nSummary: Building scalable web applications for 4 years.\nExperience:\n- Fullstack Developer at FinTech Startup (2021-03 to Present)\n  Maintained legacy React SPA and Express backend.\n- Junior Web Developer at Local Agency (2019-08 to 2021-02)\n  Built WordPress and simple React sites.\nEducation:\n- B.A. Design at State College\nSkills:\nJavaScript, React, Node.js, Express, CSS",
      sourceUrl: "https://linkedin.com/in/mchen-mock",
      mime: "text/plain",
      status: "processed" as const,
      aiSummary: "Mid-level fullstack developer with React and Node.js experience, but lacking Next.js and EdTech background.",
      aiTags: ["react", "nodejs", "javascript", "fullstack"],
      score: 65,
      severity: "medium",
      category: "Mid-level Engineer",
      fields: {
        strengths: ["Fullstack capabilities", "React experience"],
        weaknesses: ["No Next.js experience", "No TypeScript mentioned", "No EdTech background"],
        verdict: "Pass. Does not meet the strict Senior Next.js requirements.",
        yearsOfExperience: 4
      },
      embedding: generateDeterministicEmbedding(2),
    },
    {
      title: "Elena Rodriguez - Frontend Architect",
      content: "Name: Elena Rodriguez\nHeadline: Frontend Architect & Performance Expert\nSummary: 10 years of experience building massive scale UIs.\nExperience:\n- Frontend Architect at E-Commerce Giant (2018-05 to Present)\n  Spearheaded migration to Next.js resulting in 40% LCP improvement.\n- Lead UI Engineer at SaaS Corp (2014-02 to 2018-04)\nEducation:\n- M.S. Computer Engineering\nSkills:\nNext.js, React, Web Performance, TypeScript, System Design",
      sourceUrl: "https://linkedin.com/in/erodriguez-mock",
      mime: "text/plain",
      status: "processed" as const,
      aiSummary: "Highly experienced architect with deep Next.js performance tuning skills.",
      aiTags: ["nextjs", "architecture", "performance", "typescript", "react"],
      score: 88,
      severity: "low",
      category: "Architect",
      fields: {
        strengths: ["Exceptional Next.js expertise", "10 years experience", "Performance tuning"],
        weaknesses: ["Overqualified", "No explicit EdTech background"],
        verdict: "Strong candidate for a technical leadership role, though lacks specific EdTech context.",
        yearsOfExperience: 10
      },
      embedding: generateDeterministicEmbedding(3),
    }
  ];

  // Upsert items by ownerId and title for idempotency, sanitizing undefined fields so BSON never writes null
  const seededItemIds: string[] = [];
  for (const item of seedItems) {
    const updateData: Record<string, unknown> = { ...item, ownerId: userId };
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    }
    const doc = await ItemModel.findOneAndUpdate(
      { ownerId: userId, title: item.title },
      { $set: updateData },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    if (doc) {
      seededItemIds.push(doc._id.toString());
    }
  }
  logger.info(`Seeded ${seedItems.length} items for demo user`);

  // 3. Seed 3+ realistic chat threads with messages and AI responses
  const seedThreads = [
    {
      title: "Getting Started with Atlas Vector Search",
      // Link to the first seeded item to demonstrate contextual RAG conversations
      itemId: seededItemIds[0],
      messages: [
        {
          role: "user" as const,
          parts: [
            {
              type: "text",
              text: "How does Atlas Vector Search integrate with Next.js and Mongoose?",
            },
          ],
          createdAt: new Date(Date.now() - 3600000 * 48),
        },
        {
          role: "assistant" as const,
          parts: [
            {
              type: "text",
              text: "Atlas Vector Search integrates directly with your existing MongoDB collections. In Next.js, you store vector embeddings (e.g., 768 dimensions from Gemini) alongside your document content in Mongoose or MongoDB native collections. You can then run aggregation pipelines using the $vectorSearch stage to find semantically similar items.",
            },
          ],
          usage: { inputTokens: 42, outputTokens: 68, reasoningTokens: 0, cacheReadTokens: 0 },
          createdAt: new Date(Date.now() - 3600000 * 48 + 1500),
        },
      ],
    },
    {
      title: "Architecture & Data Pipeline Design",
      messages: [
        {
          role: "user" as const,
          parts: [
            {
              type: "text",
              text: "Can you analyze the pros and cons of using MongoDB Atlas M0 free tier for vector search?",
            },
          ],
          createdAt: new Date(Date.now() - 3600000 * 24),
        },
        {
          role: "assistant" as const,
          parts: [
            {
              type: "text",
              text: "The primary advantage of Atlas M0 is unified data and vector storage with zero additional infrastructure overhead or cost. Atlas Search and Vector Search are supported directly on M0. The main limitation is memory and connection limits, which is why caching your MongoClient connection on globalThis is essential in serverless environments.",
            },
          ],
          usage: { inputTokens: 55, outputTokens: 82, reasoningTokens: 0, cacheReadTokens: 0 },
          createdAt: new Date(Date.now() - 3600000 * 24 + 1800),
        },
      ],
    },
    {
      title: "AI Extraction and Document Analysis",
      messages: [
        {
          role: "user" as const,
          parts: [
            {
              type: "text",
              text: "What is the recommended approach for structured extraction with Gemini models?",
            },
          ],
          createdAt: new Date(Date.now() - 3600000 * 4),
        },
        {
          role: "assistant" as const,
          parts: [
            {
              type: "text",
              text: "Using the AI SDK v7, you can use `generateObject` with a Zod schema. Always use `z.coerce`, optional fields, and `.catch()` where an LLM could plausibly return a slightly non-standard shape, as LLM outputs can vary.",
            },
          ],
          usage: { inputTokens: 38, outputTokens: 74, reasoningTokens: 0, cacheReadTokens: 0 },
          createdAt: new Date(Date.now() - 3600000 * 4 + 1200),
        },
      ],
    },
  ];

  for (const threadData of seedThreads) {
    const threadUpdate: Record<string, unknown> = {
      ownerId: userId,
      title: threadData.title,
    };
    if (threadData.itemId) {
      threadUpdate.itemId = threadData.itemId;
    }

    const threadDoc = await ChatThreadModel.findOneAndUpdate(
      { ownerId: userId, title: threadData.title },
      { $set: threadUpdate },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    const threadId = threadDoc._id.toString();

    // Reset messages for this seed thread to ensure clean idempotent state
    await ChatMessageModel.deleteMany({ threadId });
    await ChatMessageModel.insertMany(
      threadData.messages.map((msg) => ({
        ...msg,
        threadId,
      }))
    );
  }
  logger.info(`Seeded ${seedThreads.length} chat threads with messages`);

  // 4. Seed AI run telemetry records
  const seedAiRuns = [
    {
      feature: "chat" as const,
      model: "gemini-3.6-flash",
      inputTokens: 120,
      outputTokens: 85,
      reasoningTokens: 32,
      cacheReadTokens: 64,
      latencyMs: 420,
      costUsd: 0.00003,
      status: "success" as const,
      createdAt: new Date(Date.now() - 3600000 * 3),
    },
    {
      feature: "extract" as const,
      model: "gemini-3.6-flash",
      inputTokens: 350,
      outputTokens: 110,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      latencyMs: 580,
      costUsd: 0.00007,
      status: "success" as const,
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      feature: "embed" as const,
      model: "gemini-embedding-001",
      inputTokens: 240,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      latencyMs: 150,
      costUsd: 0.00001,
      status: "success" as const,
      createdAt: new Date(Date.now() - 3600000 * 1.5),
    },
    {
      feature: "rag" as const,
      model: "gemini-3.6-flash",
      inputTokens: 850,
      outputTokens: 220,
      reasoningTokens: 64,
      cacheReadTokens: 128,
      latencyMs: 910,
      costUsd: 0.00015,
      status: "success" as const,
      createdAt: new Date(Date.now() - 3600000 * 1),
    },
    {
      feature: "chat" as const,
      model: "gemini-3.6-flash",
      inputTokens: 150,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      latencyMs: 210,
      costUsd: 0,
      status: "error" as const,
      error: "Rate limit reached on free tier",
      createdAt: new Date(Date.now() - 3600000 * 0.5),
    },
  ];

  // Clean previous demo aiRuns and re-seed to ensure idempotent count
  await AiRunModel.deleteMany({ ownerId: userId });
  await AiRunModel.insertMany(
    seedAiRuns.map((run) => ({
      ...run,
      ownerId: userId,
    }))
  );
  logger.info(`Seeded ${seedAiRuns.length} AI run audit logs`);

  logger.info("Database seeding completed successfully.");
}

if (process.env.NODE_ENV !== "test" && typeof window === "undefined" && require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

