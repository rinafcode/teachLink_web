'use client';

import type { MouseEventHandler } from 'react';

interface DiscordButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function DiscordButton({ onClick }: DiscordButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#5865F2"
          d="M20 4.2A19.6 19.6 0 0 0 16.2 3l-.2.4c1.3.3 2.5.8 3.6 1.5-1.5-1-3.2-1.6-5-2l-.3.5c-1.7-.1-3.4 0-5 .3l-.3-.5c-1.8.4-3.5 1-5 2C4.8 4.2 6 3.7 7.3 3.4L7.1 3A19.6 19.6 0 0 0 3.3 4.2C2 6.1 1.4 8.2 1.5 10.3c.1 4.1 2.2 7.9 6.1 9.7a19.6 19.6 0 0 0 4.4-1.4l-.3-.5c-1 .3-2 .5-3 .6-1.4-.4-2.6-1.1-3.5-2.1 1 .7 2.1 1.2 3.3 1.4 1.8.4 3.6.4 5.4 0 1.2-.2 2.3-.7 3.3-1.4-.9 1-2.1 1.7-3.5 2.1-1-.1-2-.3-3-.6l-.3.5c1.4.6 2.9 1 4.4 1.4 3.9-1.8 6-5.6 6.1-9.7.1-2.1-.5-4.2-1.8-6.1Z"
        />
      </svg>
      <span>Continue with Discord</span>
    </button>
  );
}

export default DiscordButton;
