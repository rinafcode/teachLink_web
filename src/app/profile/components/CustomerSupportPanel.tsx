'use client';

import { memo, useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react';
import { supportFaqs, supportContactOptions } from '../profile-data';

// ── FAQ Accordion Item ────────────────────────────────────────────────────────

interface FaqItemProps {
  id: string;
  question: string;
  answer: string;
}

function FaqItem({ id, question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headingId = `faq-heading-${id}`;
  const panelId = `faq-panel-${id}`;

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <h3>
        <button
          type="button"
          id={headingId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={toggle}
          className="flex w-full items-center justify-between px-4 py-4 text-left font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
        >
          <span>{question}</span>
          {isOpen ? (
            <ChevronUp size={18} className="shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown size={18} className="shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          )}
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        hidden={!isOpen}
        className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
      >
        {answer}
      </div>
    </div>
  );
}

// ── Contact Form ──────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function ContactForm() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitState('submitting');

    // Simulated async submission — replace with real API call
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    setSubmitState('success');
    setSubject('');
    setMessage('');
  }, []);

  if (submitState === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 text-center"
      >
        <p className="text-green-800 dark:text-green-300 font-medium">
          ✅ Your message has been sent. We&apos;ll get back to you within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState('idle')}
          className="mt-4 text-sm text-green-700 dark:text-green-400 underline hover:text-green-900 dark:hover:text-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="support-subject" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Subject
        </label>
        <input
          id="support-subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Briefly describe your issue"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label htmlFor="support-message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message
        </label>
        <textarea
          id="support-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue in detail…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 resize-none dark:placeholder-gray-400"
        />
      </div>

      {submitState === 'error' && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={submitState === 'submitting' || !subject.trim() || !message.trim()}
        className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitState === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}

// ── Contact Option Icons ──────────────────────────────────────────────────────

const contactIcons = {
  email: Mail,
  chat: MessageCircle,
  phone: Phone,
} as const;

// ── Main Panel ────────────────────────────────────────────────────────────────

function CustomerSupportPanel() {
  return (
    <section id="support-panel" role="tabpanel" aria-labelledby="support-tab" className="space-y-8">
      {/* Contact Options */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow transition-colors duration-200">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Contact Us</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {supportContactOptions.map((option) => {
            const Icon = contactIcons[option.icon as keyof typeof contactIcons] ?? Mail;
            return (
              <a
                key={option.id}
                href={option.href}
                target={option.href.startsWith('http') ? '_blank' : undefined}
                rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={option.ariaLabel}
              >
                <Icon size={24} className="text-blue-500" aria-hidden="true" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{option.description}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow transition-colors duration-200">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {supportFaqs.map((faq) => (
            <FaqItem key={faq.id} id={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow transition-colors duration-200">
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Send Us a Message</h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Can&apos;t find what you&apos;re looking for? Fill out the form below and our support team
          will respond within 24 hours.
        </p>
        <ContactForm />
      </div>
    </section>
  );
}

export default memo(CustomerSupportPanel);
