import React from 'react';
import { getLanguageConfig } from '@/utils/codeUtils';

interface SyntaxHighlighterProps {
  language: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  language,
  showLabel = true,
  size = 'md',
}) => {
  const config = getLanguageConfig(language);

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium ${padding} ${textSize}`}
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}40`,
      }}
      title={`Language: ${config.label}`}
    >
      <span
        className={`rounded-full ${dotSize} flex-shrink-0`}
        style={{ backgroundColor: config.color }}
      />
      {showLabel && config.label}
    </span>
  );
};
