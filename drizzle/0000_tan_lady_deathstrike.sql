CREATE TABLE IF NOT EXISTS "herd_entries" (
	"wallet" text PRIMARY KEY NOT NULL,
	"balance" bigint NOT NULL,
	"tier" text NOT NULL,
	"percent_supply" real NOT NULL,
	"rank" text,
	"tweet_url" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "herd_entries_tweet_url_unique" UNIQUE("tweet_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watched_wallets" (
	"wallet" text PRIMARY KEY NOT NULL,
	"rank" integer,
	"balance" real NOT NULL,
	"percent_supply" real NOT NULL,
	"tier_id" text,
	"saves" integer DEFAULT 1 NOT NULL,
	"first_saved_at" timestamp with time zone DEFAULT now(),
	"last_saved_at" timestamp with time zone DEFAULT now()
);
