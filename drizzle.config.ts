import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'turso',
  // dialect: 'sqlite'
  dbCredentials: {
    url: process.env.DB_FILE_NAME!,
    authToken: process.env.TURSO_TOKEN!
  },
});