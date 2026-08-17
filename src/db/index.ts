import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from './schema.ts'

// Each serverless invocation is short-lived and single-threaded, so a large
// pool just spends time opening connections a single request will never use
// in parallel — `max: 1` plus a short connect timeout keeps per-request
// overhead down and avoids piling onto Supabase's own connection pooler.
export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    max: 1,
    connectionTimeoutMillis: 5000,
  },
  schema,
})
