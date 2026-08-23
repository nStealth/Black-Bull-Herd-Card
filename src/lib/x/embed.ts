// Shared plumbing for X's official timeline embed.
//
// The site wall and the dashboard panel render very differently but hit the
// same three sharp edges, so those live here rather than in either component:
// the script must load once and lazily, the widget factory can hang forever,
// and re-theming needs a full re-mount.

export type EmbedTheme = 'light' | 'dark';

/**
 * How long to wait for X's embed to report itself ready.
 *
 * createTimeline() resolves only once the cross-origin iframe posts its size
 * back. If that message never arrives — blocked network, privacy extension,
 * throttled tab — the promise never settles, and a card would spin forever.
 */
const READY_TIMEOUT_MS = 12_000;

interface TwttrWidgets {
  createTimeline: (
    source: unknown,
    target: HTMLElement,
    options: unknown
  ) => Promise<unknown>;
}

interface Twttr {
  widgets?: TwttrWidgets;
}

/**
 * Load widgets.js once, on demand. Resolves null when it cannot load — an ad
 * blocker or a locked-down network is a normal outcome here, not an error.
 */
export function loadWidgetScript(): Promise<Twttr | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const w = window as unknown as { twttr?: Twttr };
  if (w.twttr?.widgets) return Promise.resolve(w.twttr);

  return new Promise((resolve) => {
    const settle = () => resolve(w.twttr?.widgets ? w.twttr : null);
    const existing = document.getElementById('twitter-wjs') as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', settle, { once: true });
      existing.addEventListener('error', () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'twitter-wjs';
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    script.addEventListener('load', settle, { once: true });
    script.addEventListener('error', () => resolve(null), { once: true });
    document.head.appendChild(script);
  });
}

export interface MountOptions {
  handle: string;
  theme: EmbedTheme;
  height: number;
  /** Card background, so the embed's chrome blends into the surrounding panel. */
  borderColor?: string;
}

/**
 * Render a profile timeline into `target`, replacing anything already there.
 *
 * Returns false when the embed could not be shown, which callers surface as a
 * plain link rather than an empty card. Clearing first is what makes a theme
 * switch work: X bakes the theme into the iframe at creation time and offers no
 * way to change it afterwards.
 */
export async function mountTimeline(
  target: HTMLElement,
  { handle, theme, height, borderColor }: MountOptions
): Promise<boolean> {
  const twttr = await loadWidgetScript();
  if (!twttr?.widgets) return false;

  target.innerHTML = '';

  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), READY_TIMEOUT_MS)
  );

  try {
    const frame = await Promise.race([
      twttr.widgets.createTimeline({ sourceType: 'profile', screenName: handle }, target, {
        height,
        theme,
        // Strip X's own header/footer/border so the embed sits inside our card.
        chrome: 'noheader nofooter noborders transparent',
        borderColor,
        dnt: true
      }),
      timeout
    ]);
    return Boolean(frame);
  } catch {
    return false;
  }
}

/**
 * Run `onVisible` once the element is near the viewport.
 *
 * Deliberately a rect check on scroll rather than IntersectionObserver, and
 * called directly rather than through requestAnimationFrame: both IO and rAF go
 * quiet in background or non-compositing tabs, and a wall that silently never
 * loads is a worse failure than a passive listener that unbinds on first hit.
 */
export function whenNearViewport(
  element: HTMLElement,
  onVisible: () => void,
  margin = 300
): () => void {
  let done = false;

  const check = () => {
    if (done) return;
    const rect = element.getBoundingClientRect();
    if (rect.top > window.innerHeight + margin || rect.bottom < -margin) return;
    done = true;
    onVisible();
    teardown();
  };

  const teardown = () => {
    window.removeEventListener('scroll', check);
    window.removeEventListener('resize', check);
    document.removeEventListener('visibilitychange', check);
  };

  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check, { passive: true });
  document.addEventListener('visibilitychange', check);
  check();

  return teardown;
}
