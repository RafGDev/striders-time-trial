import { spawn, execSync, ChildProcess } from "child_process";
import * as path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../.env.test") });

let apiProcess: ChildProcess | null = null;

async function waitForServer(url: string, timeout = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ __typename }" }),
      });
      if (response.ok) {
        console.log("✅ API server is ready");
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

export async function setup() {
  const databasePath = path.resolve(__dirname, "../../../packages/database");
  const apiPath = path.resolve(__dirname, "../../../api");
  const testDatabaseUrl = process.env.DATABASE_URL;
  const apiPort = process.env.API_PORT || "3001";
  const apiUrl = process.env.API_URL || `http://localhost:${apiPort}/graphql`;

  if (!testDatabaseUrl) {
    throw new Error("DATABASE_URL is not defined in .env.test");
  }

  console.log("🔄 Resetting test database...");
  try {
    execSync("npx prisma migrate reset --force", {
      cwd: databasePath,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: "inherit",
    });
    console.log("✅ Test database ready");
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    throw error;
  }

  const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret-for-e2e";

  console.log("🚀 Starting API server...");
  apiProcess = spawn("node", ["dist/src/main.js"], {
    cwd: apiPath,
    env: {
      ...process.env,
      PORT: apiPort,
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: "test",
      JWT_SECRET: jwtSecret,
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  apiProcess.stdout?.on("data", (data) => {
    console.log(`[API] ${data.toString().trim()}`);
  });

  apiProcess.stderr?.on("data", (data) => {
    console.error(`[API ERROR] ${data.toString().trim()}`);
  });

  (globalThis as any).__API_PROCESS__ = apiProcess;

  await waitForServer(apiUrl);
}

export async function teardown() {
  const proc = (globalThis as any).__API_PROCESS__ as ChildProcess | undefined;
  if (proc) {
    console.log("🛑 Stopping API server...");
    proc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1000));
    console.log("✅ API server stopped");
  }
}
