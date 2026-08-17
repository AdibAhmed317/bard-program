import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '#/db'
import * as schema from '#/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Every admin route check + every admin server function calls getSession().
    // Without this, each of those is a Postgres round trip — on a serverless
    // host with a remote DB, that's what made switching between admin pages feel
    // so slow. This caches the session in a signed cookie so most checks are free.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [admin(), username(), tanstackStartCookies()],
})
