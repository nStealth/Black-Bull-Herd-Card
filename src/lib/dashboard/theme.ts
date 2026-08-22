// Dashboard-scoped light/dark theme.
//
// The rest of the site is dark-only, so the theme attribute is written to
// <html> while the dashboard is mounted and removed on the way out. That keeps
// the shared header and footer in step without theming every other page.

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bbh-dashboard-theme';
const ATTRIBUTE = 'data-dash-theme';

function initial(): Theme {
  if (!browser) return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const theme = writable<Theme>(initial());

export function applyTheme(value: Theme): void {
  if (!browser) return;
  document.documentElement.setAttribute(ATTRIBUTE, value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // private mode — the theme just will not persist
  }
}

export function clearTheme(): void {
  if (!browser) return;
  document.documentElement.removeAttribute(ATTRIBUTE);
}

export function toggleTheme(): void {
  theme.update((current) => {
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return next;
  });
}
