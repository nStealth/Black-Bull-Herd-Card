// Database schema for herd_entries table
// NeonDB Postgres with Drizzle ORM

import { pgTable, text, bigint, real, boolean, timestamp } from 'drizzle-orm/pg-core';

export const herdEntries = pgTable('herd_entries', {
  wallet: text('wallet').primaryKey(),
  balance: bigint('balance', { mode: 'number' }).notNull(),
  tier: text('tier').notNull(),
  percentSupply: real('percent_supply').notNull(),
  rank: text('rank'),
  tweetUrl: text('tweet_url').unique(),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type HerdEntry = typeof herdEntries.$inferSelect;
export type NewHerdEntry = typeof herdEntries.$inferInsert;
