import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    // Use DIRECT_URL for migrations (direct connection, no PgBouncer)
    // Falls back to DATABASE_URL if DIRECT_URL is not set
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});