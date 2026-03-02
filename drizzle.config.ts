import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

// export default defineConfig({
//   schema: "./src/db/schema.ts",
//   out: "./migrations",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL!,
//   },
//   verbose: true,
//   strict: true,
// });


export default defineConfig({
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});