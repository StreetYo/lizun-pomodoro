import { duration, remaining } from './timer.js';
import { formatCountdown, formatFocusTime } from './texts.js';

const app = document.getElementById('app');
const progress = document.getElementById('progress');
const time = document.getElementById('time');
const note = document.getElementById('note');
const phase = document.getElementById('phase');
const dots = document.getElementById('dots');
const today = document.getElementById('today');
const todayCaption = document.getElementById('today-caption');
const todayValue = document.getElementById('today-value');
export const primaryButton = document.getElementById('primary');
export const skipButton = document.getElementById('skip');
export const resetButton = document.getElementById('reset');

function label(button, value) {
  button.title = value;
  button.setAttribute('aria-label', value);
}

function setText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function renderDots(state, rounds, text) {
  const filled = state.phase === 'long' ? rounds : Math.min(state.round, rounds);
  if (dots.childElementCount !== rounds) {
    dots.replaceChildren(...Array.from({ length: rounds }, () => document.createElement('span')));
  }
  [...dots.children].forEach((dot, index) => {
    dot.className = index < filled ? 'dot done' : index === filled && state.phase === 'focus' ? 'dot current' : 'dot';
  });
  dots.title = text.rounds(filled, rounds);
}

/** Last drawn phase and status, to jump the ring instead of animating it back to the start. */
let drawn = '';

/**
 * @param {import('./timer.js').TimerState} state
 * @param {{ rounds: number, focusMs: number }} stats
 */
export function render({ state, options, text, now, stats, locale }) {
  const total = duration(state, options);
  const left = remaining(state, options, now);
  const rounds = options.roundsBeforeLongBreak;

  app.dataset.phase = state.phase;
  app.dataset.status = state.status;

  const key = `${state.phase}/${state.status === 'idle' ? 'idle' : 'started'}`;
  progress.classList.toggle('jump', key !== drawn);
  drawn = key;
  const done = total ? Math.min(100, Math.max(0, ((total - left) / total) * 100)) : 0;
  progress.style.strokeDashoffset = String(100 - done);
  progress.classList.toggle('empty', done === 0);

  setText(time, formatCountdown(left));
  if (state.status === 'running') {
    const end = new Date(state.endsAt).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    setText(note, text.until(end));
  } else if (state.status === 'paused') {
    setText(note, text.paused);
  } else {
    setText(note, state.phase === 'focus' ? text.round(Math.min(state.round + 1, rounds), rounds) : text.breakReady);
  }

  setText(phase, text.phase[state.phase]);
  renderDots(state, rounds, text);

  setText(todayCaption, text.today);
  setText(todayValue, `${text.finished(stats.rounds)} · ${formatFocusTime(stats.focusMs, text)}`);
  today.title = text.todayHint;

  label(primaryButton, state.status === 'running' ? text.pause : state.status === 'paused' ? text.resume : text.start);
  label(skipButton, text.skip);
  const atCycleStart = state.status === 'idle' && state.phase === 'focus' && state.round === 0;
  label(resetButton, state.status === 'idle' ? text.resetCycle : text.reset);
  resetButton.disabled = atCycleStart;

  app.hidden = false;
}
