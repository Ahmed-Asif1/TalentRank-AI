import { MongoClient, type Db } from "mongodb";
import mongoose from "mongoose";
import { env } from "@/lib/env";

/**
 * Cache the MongoClient on globalThis in development.
 * Next.js hot-module reloading frequently re-evaluates server modules, which creates
 * new client instances on every reload and quickly exhausts MongoDB Atlas M0 free tier
 * connection limits. Caching on globalThis guarantees a single connection pool.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB;

/**
 * Returns the cached MongoClient instance.
 * Instantiates new MongoClient exactly once across all environments and reloads.
 */
export function getMongoClient(): MongoClient {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  }
  return global._mongoClient;
}

const clientPromise: Promise<MongoClient> = (function getClientPromise() {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = getMongoClient().connect();
  }
  return global._mongoClientPromise;
})();

/**
 * Connects to MongoDB via native driver and returns the client and default database.
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise;
  const db = client.db(dbName);
  return { client, db };
}

/**
 * Returns the raw native Db instance required by Better Auth MongoDB adapter.
 * Evaluates synchronously without awaiting connection so module evaluation does not block offline builds.
 */
export function getRawDb(): Db {
  return getMongoClient().db(dbName);
}

/**
 * Connects Mongoose using the single database URI and cached connection.
 */
export async function connectMongoose(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  }
  return global._mongoosePromise;
}

export { clientPromise, mongoose };
