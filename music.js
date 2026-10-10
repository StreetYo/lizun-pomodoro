import { media } from '/__sdk/index.js';

/**
 * Pauses what is playing for a break. Returns the player it paused, to play it again when focus
 * starts, or null when nothing was playing or it could not be paused.
 */
export async function pauseMusic() {
  try {
    const now = await media.getNowPlaying();
    if (!now?.playing || !now.canToggle) return null;
    await media.togglePlayPause();
    return now.sourceApp;
  } catch (error) {
    console.warn('could not pause the music', error);
    return null;
  }
}

/** Plays again what `pauseMusic` paused, if the same player is still there and still paused. */
export async function resumeMusic(app) {
  try {
    const now = await media.getNowPlaying();
    if (!now || now.playing || !now.canToggle || now.sourceApp !== app) return;
    await media.togglePlayPause();
  } catch (error) {
    console.warn('could not play the music again', error);
  }
}
