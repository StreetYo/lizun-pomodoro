# Pomodoro for Lizun

A focus timer in the [Lizun](https://github.com/StreetYo/Lizun) island: 25 minutes of focus, a
5-minute break, and a 15-minute break after every fourth focus round. The countdown also shows
in the closed island while it runs.

## Install

In Lizun, open Settings > Widgets > Add a widget, paste this link and press Install:

```
https://github.com/StreetYo/lizun-pomodoro
```

To install a fixed version, use the link of a release instead, for example
`https://github.com/StreetYo/lizun-pomodoro/releases/tag/v1.0.0`.

## Using it

- **Start** (the big button) starts the current phase; press it again to pause, and once more to
  resume. **Skip** ends the phase now and moves to the next one. **Reset** starts the current
  phase over; pressed again on a phase that has not started, it goes back to the first focus
  round.
- The ring fills as the phase goes; inside it are the time left and the time it ends. The dots
  are the focus rounds of the cycle: filled ones are done, the outlined one is the current round.
- When a phase ends, a short chime plays and the timer waits for Start, unless "Start the next
  phase by itself" is on.
- The timer keeps the moment the phase ends, so it stays right when the island reloads, the
  computer sleeps or Lizun restarts. A phase that ended more than a minute before Lizun could
  notice (the computer was asleep, Lizun was closed) is counted, but without a chime and without
  starting the next phase.
- **Today** shows the focus rounds finished today and the time spent in focus. A skipped focus
  round adds the minutes it ran but not a finished round; a reset one adds nothing. The numbers
  are kept per day for the last 90 days.
- In the closed island: a timer icon for focus or a cup for breaks, the phase and the time left,
  dimmed while paused. Nothing is shown while the timer is stopped.

## Settings

Settings > Widgets > Pomodoro:

| Setting | Default |
|---|---|
| Focus, Short break, Long break | 25, 5 and 15 minutes |
| Focus rounds before a long break | 4 |
| Start the next phase by itself | Off |
| Chime when a phase ends | On |
| Pause music on breaks | Off. Pauses what is playing when a break starts and plays it again when focus starts, only if the widget paused it and the same player is still paused. Music you start again yourself during the break is left alone. |
| Show the timer in the closed island | On |

A new length applies to the next phase; one that is running keeps its length.

The chime is made with Web Audio. The island lets a widget play sound after a click in it, so
press Start once after Lizun starts for the chime to play.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Keeps the timer and the daily numbers. They stay on this computer, in Lizun's own storage. |
| `activity` | Shows the countdown in the closed island. |
| `media:read` | Tells whether music is playing, for "Pause music on breaks". |
| `media:control` | Pauses and resumes that music. Only used when the setting is on. |

No network access.

## Development

The widget is plain HTML, CSS and JavaScript with no build step:

| File | What it is |
|---|---|
| `manifest.json` | Id, size, permissions, settings and their Russian translation |
| `index.html`, `style.css` | Page shown in the island and its icons, built on the island theme (`--lz-*` variables) |
| `main.js` | Buttons, ticking, phase ends, live activity, settings and language |
| `timer.js` | The timer's state and how it moves between phases, as pure functions |
| `view.js` | Draws the ring, countdown, rounds and today's numbers |
| `stats.js` | Focus rounds and minutes per day in storage |
| `chime.js` | The chime, made with Web Audio |
| `music.js` | Pausing and resuming music for breaks |
| `texts.js` | The widget's texts in English and Russian, time formatting |

To try changes, choose this folder in Settings > Widgets > Add a widget, or copy it to
`%APPDATA%\app.lizun.desktop\widgets\lizun.pomodoro\` and press Reload. How widgets work:
[Writing a Lizun widget](https://github.com/StreetYo/Lizun/blob/master/docs/widgets.md).

To release a version, raise `version` in `manifest.json`, then tag and publish a GitHub release
(`v1.0.1`).
