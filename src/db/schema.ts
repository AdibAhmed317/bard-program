import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id: serial().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

/* ------------------------------ better-auth ------------------------------- */
/* Shape matches better-auth's core schema + the "admin" plugin's added      */
/* fields (role/banned/banReason/banExpires on user, impersonatedBy on       */
/* session). Table/column names must match exactly for the drizzle adapter.  */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* --------------------------------- admin ----------------------------------- */
/* Participants, rooms and attendance for Teachers Development Training 2026. */

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomNumber: text('room_number').notNull().unique(),
  block: text('block'),
  capacity: integer('capacity').notNull().default(2),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const participants = pgTable(
  'participants',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    designation: text('designation'),
    department: text('department'),
    phone: text('phone'),
    email: text('email'),
    idCardNo: text('id_card_no'),
    groupLeader: text('group_leader'),
    roomId: integer('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  // Teacher IDs must be unique, but participants without one are allowed —
  // hence a partial index rather than a plain unique column.
  (t) => [
    uniqueIndex('participants_id_card_no_unique')
      .on(t.idCardNo)
      .where(sql`${t.idCardNo} is not null and ${t.idCardNo} <> ''`),
  ],
)

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  day: text('day').notNull(),
  title: text('title').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  place: text('place'),
  speaker: text('speaker'),
  moderator: text('moderator'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const resourceKindEnum = pgEnum('resource_kind', ['slide', 'file', 'link'])

export const sessionResources = pgTable('session_resources', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  kind: resourceKindEnum('kind').notNull().default('link'),
  label: text('label').notNull(),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent'])

export const attendance = pgTable(
  'attendance',
  {
    id: serial('id').primaryKey(),
    participantId: integer('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    status: attendanceStatusEnum('status').notNull().default('present'),
    markedById: text('marked_by_id').references(() => user.id, { onDelete: 'set null' }),
    markedAt: timestamp('marked_at').notNull().defaultNow(),
  },
  (t) => [unique('attendance_participant_day_unique').on(t.participantId, t.day)],
)
