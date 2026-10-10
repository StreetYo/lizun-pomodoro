import { activity, language, media, ready, settings, storage } from '/__sdk/index.js';
import { chime, unlockAudio } from './chime.js';
import { pauseMusic, resumeMusic } from './music.js';
import { addFocus, loadStats, statsFor } from './stats.js';
import { formatCountdown, textsFor } from './texts.js';
import * as timer from './timer.js';
import { primaryButton, render, resetButton, skipButton } from './view.js';

const COLORS = { focus: '#ff9f0a', short: '#30d158', long: '#30d158' };
const ICONS = { focus: 'timer', short: 'coffee', long: 'coffee' };

/**
 * A phase that ran out longer ago than this ended while nobody was there (sleep, Lizun closed):
 * it is counted, but without a chime and without starting the next phase on its own.
 */
const MISSED_AFTER = 60_000;
/** How long a "still playing" report right after pausing the music is taken as the old state. */
const MEDIA_SETTLE = 3000;

let text;
let options;
let locale;
let secondary;
/** @type {import('./timer.js').TimerState} */
let state;
let tickTimer;
let pausedMusicAt = 0;

function save() {
  storage.set('timer', state).catch((error) => console.warn('could not save the timer', error));
}

function update() {
  const now = Date.now();
  render({ state, options, text, now, stats: statsFor(now), locale });
  showActivity(now);
  scheduleTick(now);
}

function commit(next) {
  state = next;
  save();
  update();
}

/** What the closed island shows, to skip sending the same activity again. */
let shownActivity;

function showActivity(now) {
  const next =
    options.showInIsland && state.status !== 'idle'
      ? {
          leading: { icon: ICONS[state.phase], color: COLORS[state.phase] },
          title: text.phase[state.phase],
          trailing: {
            text: formatCountdown(timer.remaining(state, options, now)),
            // Dimmed while paused; the island's own text colour while running.
            ...(state.status === 'paused' && { color: secondary }),
          },
        }
      : null;
  const key = JSON.stringify(next);
  if (key === shownActivity) return;
  shownActivity = key;
  const change = next ? activity.set(next) : activity.clear();
  change.catch((error) => console.warn('could not update the live activity', error));
}

/** Ticks when the shown second changes, so the countdown and the closed island stay in step. */
function scheduleTick(now) {
  clearTimeout(tickTimer);
  if (state.status !== 'running') return;
  const left = state.endsAt - now;
  if (left <= 0) {
    tickTimer = setTimeout(tick);
    return;
  }
  tickTimer = setTimeout(tick, (left % 1000 || 1000) + 15);
}

function tick() {
  if (state.status === 'running' && state.endsAt <= Date.now()) finishPhase({ skipped: false });
  else update();
}

/** Breaks pause the music when the setting asks; focus plays again what the widget paused. */
async function followMusic(previous, next) {
  if (options.pauseMusic && previous.phase === 'focus' && timer.isBreak(next.phase) && !next.musicApp) {
    pausedMusicAt = Date.now();
    const app = await pauseMusic();
    if (app && state.phase === next.phase) commit({ ...state, musicApp: app });
  } else if (next.phase === 'focus' && next.status === 'running' && next.musicApp) {
    commit({ ...state, musicApp: null });
    if (options.pauseMusic) await resumeMusic(next.musicApp);
  }
}

function change(next) {
  const previous = state;
  commit(next);
  followMusic(previous, next);
}

/** Ends the current phase: counts it, chimes and moves to the next one. */
function finishPhase({ skipped }) {
  const now = Date.now();
  const ended = state;
  const endedAt = skipped || ended.status === 'idle' ? now : ended.endsAt;
  const missed = !skipped && now - endedAt > MISSED_AFTER;

  if (ended.phase === 'focus' && ended.status !== 'idle') {
    const total = timer.duration(ended, options);
    const spent = skipped ? total - timer.remaining(ended, options, now) : total;
    addFocus(endedAt, spent, !skipped);
  }
  if (!skipped && !missed && options.sound) chime(ended.phase === 'focus' ? 'focusEnd' : 'breakEnd');

  let next = timer.next(ended, options);
  // A phase that ran out starts the next one at the moment it ended, so nothing drifts.
  if (options.autoStart && !missed && ended.status !== 'idle') next = timer.start(next, options, endedAt);
  change(next);
}

primaryButton.addEventListener('click', () => {
  unlockAudio();
  const now = Date.now();
  if (state.status === 'running') change(timer.pause(state, now));
  else if (state.status === 'paused') change(timer.resume(state, now));
  else change(timer.start(state, options, now));
});

skipButton.addEventListener('click', () => {
  unlockAudio();
  finishPhase({ skipped: true });
});

resetButton.addEventListener('click', () => commit(timer.reset(state)));

// Any click in the widget lets it play the chime later.
document.addEventListener('pointerdown', unlockAudio, true);

const context = await ready();
text = textsFor(context.language);
locale = context.language;
language.subscribe((next) => {
  text = textsFor(next);
  locale = next;
  update();
});
secondary = context.theme.textSecondary;
options = context.settings;
settings.subscribe((next) => {
  options = next;
  state = timer.fitRounds(state, options);
  update();
});

// Music the user starts again during a break is no longer the widget's to play.
media.subscribe((nowPlaying) => {
  if (!state?.musicApp || !nowPlaying?.playing || nowPlaying.sourceApp !== state.musicApp) return;
  if (Date.now() - pausedMusicAt < MEDIA_SETTLE) return;
  commit({ ...state, musicApp: null });
});

await loadStats().catch((error) => console.warn('could not load the stats', error));
state = timer.fitRounds(timer.restore(await storage.get('timer').catch(() => null), options), options);
if (state.status === 'running' && state.endsAt <= Date.now()) finishPhase({ skipped: false });
else update();

// Redraws now and then, so "today" turns over at midnight and a late timer catches up.
setInterval(update, 30_000);
