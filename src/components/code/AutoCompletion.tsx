import React from 'react';
import { Zap, ZapOff } from 'lucide-react';
import { getAutoCompletionSuggestions, type CompletionSuggestion } from '@/utils/codeUtils';

interface AutoCompletionProps {
  language: string;
  word: string;
  enabled: boolean;
  onToggle: () => void;
  onSelect?: (suggestion: CompletionSuggestion) => void;
}

const KIND_COLORS: Record<CompletionSuggestion['kind'], string> = {
  keyword: 'text-purple-400',
  snippet: 'text-blue-400',
  function: 'text-yellow-400',
  variable: 'text-green-400',
};

const KIND_LABELS: Record<CompletionSuggestion['kind'], string> = {
  keyword: 'kw',
  snippet: '{}',
  function: 'fn',
  variable: 'var',
};

export const AutoCompletion: React.FC<AutoCompletionProps> = ({
  language,
  word,
  enabled,
  onToggle,
  onSelect,
}) => {
  const suggestions = enabled && word
    ? getAutoCompletionSuggestions(language, word)
    : [];

  return (
    <div className="relative flex items-center gap-2">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        title={enabled ? 'Disable auto-completion' : 'Enable auto-completion'}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          enabled
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
      >
        {enabled ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
        {enabled ? 'AI Assist' : 'Assist Off'}
      </button>

      {/* Suggestions panel */}
      {suggestions.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 z-50 w-72 rounded-lg shadow-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1e2e 0%, #16161f 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <div className="px-3 py-1.5 border-b border-gray-700 text-[10px] text-gray-500 uppercase tracking-widest">
            Suggestions for &quot;{word}&quot;
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {suggestions.slice(0, 8).map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => onSelect?.(s)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                             hover:bg-white/5 transition-colors group"
                >
                  <span
                    className={`text-[10px] font-mono font-bold w-6 text-center flex-shrink-0 ${KIND_COLORS[s.kind]}`}
                  >
                    {KIND_LABELS[s.kind]}
                  </span>
                  <span className="flex-1 text-gray-200 truncate font-mono">{s.label}</span>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-400 truncate max-w-[100px]">
                    {s.detail}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
