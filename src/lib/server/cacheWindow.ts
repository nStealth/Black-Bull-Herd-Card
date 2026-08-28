/**
 * The one cache window the whole site shares.
 *
 * Every visitor inside the same minute is served the same response, and a
 * visitor arriving part-way through does not start a fresh one — they get what
 * is left of the window already running. That is what `s-maxage` does at the
 * CDN: the edge holds one copy, hands it to everyone, and only the request
 * that finds it expired goes back to the function.
 *
 * `s-maxage` is stated explicitly even though Vercel falls back to `max-age`
 * when it is absent, because the two are not the same instruction — one is the
 * shared window, the other is what a single browser keeps — and relying on the
 * fallback hides which one was meant.
 */
export const WINDOW_SEC = 60;

/**
 * How long the edge may keep serving an expired copy while it fetches a new
 * one behind the scenes. A visitor never waits for an upstream that is slow or
 * rate-limited; they get last minute's numbers and the page's own timestamp
 * says how old they are.
 */
const SWR_SEC = 600;

/** The shared cache header. Read-only routes only — never for per-wallet data. */
export const publicWindow = `public, max-age=${WINDOW_SEC}, s-maxage=${WINDOW_SEC}, stale-while-revalidate=${SWR_SEC}`;
