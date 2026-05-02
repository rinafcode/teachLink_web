export const VIDEO_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VIDEO_KEYBOARD_SHORTCUTS = {
  playPause: ' ',
  seekBackward: 'ArrowLeft',
  seekForward: 'ArrowRight',
  volumeUp: 'ArrowUp',
  volumeDown: 'ArrowDown',
  mute: 'm',
} as const;

export const VIDEO_SEEK_STEP_SECONDS = 10;
