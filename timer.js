// The timer as plain data and pure functions, so it can be stored and restored as it is.
//
// A running phase keeps the moment it ends (`endsAt`), not a countdown, so a reload, sleep or
// restart keeps the right time. A paused phase keeps what was left (`remainingMs`).

/** @typedef {'focus' | 'short' | 'long'} Phase */
/** @typedef {'idle' | 'running' | 'paused'} Status */

/**
 * @typedef {object} TimerState
 * @property {Phase} phase
 * @property {number} round Focus rounds finished in this cycle.
 * @property {Status} status
 * @property {number | null} endsAt When a running phase ends, in ms since the epoch.
 * @property {number | null} remainingMs What is left of a paused phase.
 * @property {number | null} durationMs Length of the started phase; settings changed later do not change it.
 * @property {string | null} musicApp The player the widget paused for a break, to play it again.
 */

const MINUTE = 60_000;
const PHASES = ['focus', 'short', 'long'];
const STATUSES = ['idle', 'running', 'paused'];

/** @returns {TimerState} */
export function initialState() {
  return { phase: 'focus', round: 0, status: 'idle', endsAt: null, remainingMs: null, durationMs: null, musicApp: null };
}

export function phaseLength(phase, options) {
  const minutes = { focus: options.focusMinutes, short: options.shortBreakMinutes, long: options.longBreakMinutes };
  return minutes[phase] * MINUTE;
}

/** A stored state checked field by field; anything broken starts over from the beginning. */
export function restore(stored, options) {
  const state = initialState();
  if (!stored || typeof stored !== 'object') return state;
  const number = (value) => (Number.isFinite(value) && value >= 0 ? value : null);
  if (PHASES.includes(stored.phase)) state.phase = stored.phase;
  if (STATUSES.includes(stored.status)) state.status = stored.status;
  state.round = Math.min(Math.floor(number(stored.round) ?? 0), options.roundsBeforeLongBreak);
  state.endsAt = number(stored.endsAt);
  state.remainingMs = number(stored.remainingMs);
  state.durationMs = number(stored.durationMs);
  state.musicApp = typeof stored.musicApp === 'string' ? stored.musicApp : null;

  if (state.status !== 'idle' && !state.durationMs) state.status = 'idle';
  if (state.status === 'running' && state.endsAt === null) state.status = 'idle';
  if (state.status === 'paused' && state.remainingMs === null) state.status = 'idle';
  return state.status === 'idle' ? toIdle(state) : state;
}

/** Fewer rounds in the settings than the cycle has gone through: the cycle is at its last one. */
export function fitRounds(state, options) {
  const rounds = options.roundsBeforeLongBreak;
  if (state.phase === 'long' || state.round < rounds) return state;
  return { ...state, round: rounds - 1 };
}

function toIdle(state) {
  return { ...state, status: 'idle', endsAt: null, remainingMs: null, durationMs: null };
}

/** Length of the current phase: the started one, or what the settings say for one not started. */
export function duration(state, options) {
  return state.status === 'idle' ? phaseLength(state.phase, options) : state.durationMs;
}

export function remaining(state, options, now) {
  if (state.status === 'running') return Math.max(0, state.endsAt - now);
  if (state.status === 'paused') return state.remainingMs;
  return phaseLength(state.phase, options);
}

/** Starts the current phase from `now`, which may be in the past when one phase follows another. */
export function start(state, options, now) {
  const durationMs = phaseLength(state.phase, options);
  return { ...state, status: 'running', durationMs, endsAt: now + durationMs, remainingMs: null };
}

export function pause(state, now) {
  return { ...state, status: 'paused', remainingMs: Math.max(0, state.endsAt - now), endsAt: null };
}

export function resume(state, now) {
  return { ...state, status: 'running', endsAt: now + state.remainingMs, remainingMs: null };
}

/** Back to the start of the current phase, or of the whole cycle when the phase is not started. */
export function reset(state) {
  if (state.status !== 'idle') return toIdle(state);
  return { ...initialState(), musicApp: state.musicApp };
}

/** The phase after the current one, not started yet. A focus round counts whether it ran out or was skipped. */
export function next(state, options) {
  if (state.phase === 'focus') {
    const round = state.round + 1;
    const rounds = options.roundsBeforeLongBreak;
    return toIdle({ ...state, phase: round >= rounds ? 'long' : 'short', round: Math.min(round, rounds) });
  }
  return toIdle({ ...state, phase: 'focus', round: state.phase === 'long' ? 0 : state.round });
}

export function isBreak(phase) {
  return phase !== 'focus';
}
