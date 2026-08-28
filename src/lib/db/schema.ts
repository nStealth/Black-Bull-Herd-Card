// Database schema for herd_entries table
// NeonDB Postgres with Drizzle ORM

import { pgTable, text, bigint, integer, real, boolean, timestamp } from 'drizzle-orm/pg-core';

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

/**
 * Wallets visitors have chosen to keep an eye on.
 *
 * One row per address, not per visitor: the site has no accounts, so there is
 * nobody to attribute a row to. Nothing identifying the visitor is stored —
 * no IP, no session, no fingerprint — only the public Solana address they
 * asked to follow and what the rank lookup returned at the time.
 *
 * The figures are a snapshot from the moment of saving. They are updated in
 * place on a re-save rather than appended, so this is a register of which
 * wallets people care about, not a price history.
 */
export const watchedWallets = pgTable('watched_wallets', {
  wallet: text('wallet').primaryKey(),
  /** Null when the wallet holds too little to sit inside the ranked slice. */
  rank: integer('rank'),
  balance: real('balance').notNull(),
  percentSupply: real('percent_supply').notNull(),
  tierId: text('tier_id'),
  /** How many times this address has been saved, across all visitors. */
  saves: integer('saves').notNull().default(1),
  firstSavedAt: timestamp('first_saved_at', { withTimezone: true }).defaultNow(),
  lastSavedAt: timestamp('last_saved_at', { withTimezone: true }).defaultNow()
});

export type WatchedWallet = typeof watchedWallets.$inferSelect;
