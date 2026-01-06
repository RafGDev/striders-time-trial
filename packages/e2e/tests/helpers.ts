import { PrismaService } from "@striders/database";
import * as path from "path";
import { config } from "dotenv";
import { sign } from "jsonwebtoken";

// Load test environment
config({ path: path.resolve(__dirname, "../.env.test") });

const API_URL = process.env.API_URL || "http://localhost:3001/graphql";
const DATABASE_URL = process.env.DATABASE_URL!;
// Must match the JWT_SECRET used in global-setup.ts when starting the API
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-e2e";

// Singleton Prisma instance for tests
let prismaInstance: PrismaService | null = null;

export function getPrisma(): PrismaService {
  if (!prismaInstance) {
    prismaInstance = new PrismaService(DATABASE_URL);
  }
  return prismaInstance;
}

export async function closePrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string; extensions?: unknown }>;
}

export async function graphql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<GraphQLResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  return response.json() as Promise<GraphQLResponse<T>>;
}

/**
 * Generate a JWT token for testing authenticated endpoints
 */
export function generateTestToken(
  userId: string,
  name: string = "Test User"
): string {
  return sign({ sub: userId, name }, JWT_SECRET, { expiresIn: "1h" });
}

export async function cleanDatabase(): Promise<void> {
  const prisma = getPrisma();
  // Use TRUNCATE CASCADE for reliable cleanup
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE club_members, clubs, time_trials, events, courses, users CASCADE
  `);
}
