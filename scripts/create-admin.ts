import { config } from 'dotenv'
config({ path: ['.env.local', '.env'] })

// Dynamic imports: must run after dotenv has populated process.env, and
// static imports would be hoisted above the config() call above.
const { eq } = await import('drizzle-orm')
const { db } = await import('../src/db/index.ts')
const { user } = await import('../src/db/schema.ts')
const { auth } = await import('../src/lib/auth.ts')

const [, , usernameArg, password, name] = process.argv

if (!usernameArg || !password) {
  console.error('Usage: bun run admin:create <username> <password> [name]')
  process.exit(1)
}

// better-auth's username plugin still stores an email internally; it's never
// shown or emailed to anyone, sign-in happens by username.
const internalEmail = `${usernameArg}@admin.local`

const { user: created } = await auth.api.signUpEmail({
  body: { email: internalEmail, password, name: name ?? usernameArg, username: usernameArg },
})

await db.update(user).set({ role: 'admin' }).where(eq(user.id, created.id))

console.log(`Admin account ready — sign in with username: ${usernameArg}`)
process.exit(0)
