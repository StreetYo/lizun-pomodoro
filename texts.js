const RU_PLURAL = new Intl.PluralRules('ru');
const RU_ROUNDS = { one: 'раунд', few: 'раунда', many: 'раундов' };

/** The widget's own texts by language; the manifest translates its name and settings. */
export const TEXTS = {
  en: {
    phase: { focus: 'Focus', short: 'Break', long: 'Long break' },
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    skip: 'Skip to the next phase',
    reset: 'Start this phase over',
    resetCycle: 'Start the cycle over',
    paused: 'Paused',
    until: (time) => `until ${time}`,
    round: (round, rounds) => `Round ${round} of ${rounds}`,
    breakReady: 'Time for a break',
    rounds: (round, rounds) => `${round} of ${rounds} focus rounds done`,
    today: 'Today',
    todayHint: 'Focus rounds finished today and time spent in focus',
    finished: (count) => (count === 1 ? '1 round' : `${count} rounds`),
    minutes: (minutes) => `${minutes} min`,
    hours: (hours, minutes) => (minutes ? `${hours} h ${minutes} m` : `${hours} h`),
  },
  ru: {
    phase: { focus: 'Фокус', short: 'Перерыв', long: 'Длинный перерыв' },
    start: 'Старт',
    pause: 'Пауза',
    resume: 'Продолжить',
    skip: 'Перейти к следующему этапу',
    reset: 'Начать этот этап заново',
    resetCycle: 'Начать цикл заново',
    paused: 'На паузе',
    until: (time) => `до ${time}`,
    round: (round, rounds) => `Раунд ${round} из ${rounds}`,
    breakReady: 'Время отдохнуть',
    rounds: (round, rounds) => `Пройдено раундов: ${round} из ${rounds}`,
    today: 'Сегодня',
    todayHint: 'Раунды фокуса за сегодня и время в фокусе',
    finished: (count) => `${count} ${RU_ROUNDS[RU_PLURAL.select(count)] ?? 'раундов'}`,
    minutes: (minutes) => `${minutes} мин`,
    hours: (hours, minutes) => (minutes ? `${hours} ч ${minutes} м` : `${hours} ч`),
  },
};

export function textsFor(language) {
  return TEXTS[language] ?? TEXTS[language?.split('-')[0]] ?? TEXTS.en;
}

/** `m:ss`, rounding up so the last second shows 0:01 and a new phase shows its full length. */
export function formatCountdown(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatFocusTime(ms, text) {
  const minutes = Math.floor(ms / 60_000);
  return minutes < 60 ? text.minutes(minutes) : text.hours(Math.floor(minutes / 60), minutes % 60);
}
