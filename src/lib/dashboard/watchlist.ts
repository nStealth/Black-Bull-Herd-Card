import { browser } from '$app/environment';
import { writable } from 'svelte/store';

/**
 * Wallets a visitor has chosen to keep, held in their own browser.
 *
 * There is no account and no server-side storage, so this is per-browser and
 * private by construction — nothing about a saved address is ever sent
 * anywhere except the same public rank lookup anyone can call.
 *
 * The balance and rank recorded here are what the lookup returned the last
 * time this visitor ran it. That is the one kind of history the site can
 * honestly offer without a database: not "how this wallet moved", which would
 * need a server watching it, but "what changed since you last looked".
 */
export interface SavedWallet {
  address: string;
  /** Null when the wallet holds too little to be inside the ranked slice. */
  rank: number | null;
  balance: number;
  /** When these figures were recorded, in epoch ms. */
  seenAt: number;
}

const KEY = 'ansem:watchlist:v1';
const MAX = 10;

function load(): SavedWallet[] {
  if (!browser) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Anything hand-edited or written by an older shape is dropped rather than
    // trusted; a watchlist is not worth a runtime error.
    return parsed
      .filter(
        (w): w is SavedWallet =>
          w &&
          typeof w.address === 'string' &&
          typeof w.balance === 'number' &&
          typeof w.seenAt === 'number' &&
          (w.rank === null || typeof w.rank === 'number')
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function persist(list: SavedWallet[]) {
  if (!browser) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private mode, or the quota is full. The list still works for this visit.
  }
}

const store = writable<SavedWallet[]>(load());

store.subscribe(persist);

export const watchlist = {
  subscribe: store.subscribe,

  /** Add or refresh one wallet, newest first. */
  save(entry: SavedWallet) {
    store.update((list) => [entry, ...list.filter((w) => w.address !== entry.address)].slice(0, MAX));
  },

  remove(address: string) {
    store.update((list) => list.filter((w) => w.address !== address));
  },

  clear() {
    store.set([]);
  }
};

export const WATCHLIST_MAX = MAX;
