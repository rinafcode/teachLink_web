'use client';

/**
 * LearningAssistant – AI chat UI
 *
 * API (placeholder – implement backend to match):
 *   POST /api/ai/chat  { message: string; context?: string }
 *   → ApiResponse<{ reply: string }>
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply: string;
}

export default function LearningAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post<ApiResponse<ChatResponse>>('/api/ai/chat', {
        message: text,
        context: 'learning',
      });
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.data.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setError('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section
      className="flex flex-col h-[600px] bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden"
      aria-label="AI Learning Assistant"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
        <Bot className="w-5 h-5 text-[#0066FF] dark:text-[#00C2FF]" aria-hidden="true" />
        <h2 className="font-semibold text-[#0F172A] dark:text-white">Learning Assistant</h2>
      </div>

      {/* Message thread */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] text-center mt-8">
            Ask me anything about your courses or learning goals.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-[#0066FF] dark:bg-[#00C2FF]'
                  : 'bg-[#E2E8F0] dark:bg-[#334155]'
              }`}
              aria-hidden="true"
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-[#0066FF] dark:text-[#00C2FF]" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#0066FF] dark:bg-[#00C2FF] text-white'
                  : 'bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0F172A] dark:text-white'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-2" aria-label="Assistant is typing">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E2E8F0] dark:bg-[#334155] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#0066FF] dark:text-[#00C2FF]" aria-hidden="true" />
            </div>
            <div className="bg-[#F1F5F9] dark:bg-[#0F172A] rounded-xl px-3 py-2 flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#94A3B8] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 text-center" role="alert">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#E2E8F0] dark:border-[#334155] flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          disabled={loading}
          aria-label="Message input"
          className="flex-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#0066FF] dark:bg-[#00C2FF] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
