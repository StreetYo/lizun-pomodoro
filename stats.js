import { storage } from '/__sdk/index.js';

const KEY = 'days';
/** Days kept in storage; older ones are dropped. */
const KEEP_DAYS = 90;

/** Local date such as `2026-10-10`, the key a day's numbers are kept under. */
export function dayKey(time) {
  const date = new Date(time);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Finished focus rounds and focus time by date: `{ '2026-10-10': { rounds: 3, focusMs: 4500000 } }`. */
let days = {};

export async function loadStats() {
  const stored = await storage.get(KEY);
  days = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

/** @returns {{ rounds: number, focusMs: number }} */
export function statsFor(time) {
  const day = days[dayKey(time)];
  return { rounds: day?.rounds ?? 0, focusMs: day?.focusMs ?? 0 };
}

/** Adds focus time, and a finished round when `finished`, to the day `time` falls on. */
export function addFocus(time, focusMs, finished) {
  const key = dayKey(time);
  const day = statsFor(time);
  days = { ...days, [key]: { rounds: day.rounds + (finished ? 1 : 0), focusMs: day.focusMs + Math.max(0, focusMs) } };
  const keys = Object.keys(days).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete days[old];
  storage.set(KEY, days).catch((error) => console.warn('could not save the stats', error));
}
