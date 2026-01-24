'use client';

import { useMemo, useState } from 'react';
import type { CodeChallengeQuizQuestion, UseQuizReturn } from '@/hooks/useQuiz';

interface CodeChallengeQuestionProps {
  question: CodeChallengeQuizQuestion;
  quizState: UseQuizReturn;
}

function normalizeOutput(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function CodeChallengeQuestion({
  question,
  quizState,
}: CodeChallengeQuestionProps) {
  const { answers, isReviewMode, isCompleted, actions } = quizState;
  const existing = answers[question.id];

  const [code, setCode] = useState<string>(
    existing?.value ?? question.codeTemplate ?? ''
  );
  const [testResults, setTestResults] = useState<boolean[]>(
    (existing?.meta?.testResults as boolean[] | undefined) ?? []
  );
  const [isRunning, setIsRunning] = useState(false);

  const hasTestCases = Boolean(question.testCases && question.testCases.length);

  const overallPassed = useMemo(
    () => (testResults.length ? testResults.every(Boolean) : false),
    [testResults]
  );

  const runTests = () => {
    if (!hasTestCases || !question.testCases) return;

    setIsRunning(true);

    const results = question.testCases.map((testCase) => {
      try {
        const userFunction = new Function('input', code);
        const output = userFunction(testCase.input);
        return normalizeOutput(output) === normalizeOutput(testCase.expectedOutput);
      } catch {
        return false;
      }
    });

    setTestResults(results);
    actions.setCodeChallengeResult(question.id, { code, testResults: results });
    setIsRunning(false);
  };

  const onChangeCode = (value: string) => {
    setCode(value);
    actions.setCodeDraft(question.id, value);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium text-[#0F172A] dark:text-white">{question.text}</div>

      <textarea
        value={code}
        onChange={(e) => onChangeCode(e.target.value)}
        readOnly={isReviewMode || isCompleted}
        className="w-full min-h-[240px] font-mono text-sm p-3 border border-[#E2E8F0] dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
      />

      {!isReviewMode && !isCompleted ? (
        <button
          onClick={runTests}
          disabled={isRunning || !hasTestCases}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : hasTestCases ? 'Run Tests' : 'No tests available'}
        </button>
      ) : null}

      {testResults.length > 0 && question.testCases ? (
        <div className="space-y-2">
          <div
            className={`text-sm font-medium ${
              overallPassed ? 'text-[#0066FF] dark:text-[#00C2FF]' : 'text-red-700'
            }`}
          >
            {overallPassed ? 'All tests passed' : 'Some tests failed'}
          </div>

          {question.testCases.map((testCase, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                testResults[index]
                  ? 'bg-[#F0F9FF] dark:bg-[#1E3A8A]/20 border-[#0066FF]/20 dark:border-[#00C2FF]/20'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-[#0F172A] dark:text-white">Test Case {index + 1}</div>
                  <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">Input: {testCase.input}</div>
                  <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    Expected: {testCase.expectedOutput}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    testResults[index]
                      ? 'text-[#0066FF] dark:text-[#00C2FF]'
                      : 'text-red-700'
                  }`}
                >
                  {testResults[index] ? 'Pass' : 'Fail'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasTestCases && (isReviewMode || isCompleted) && !existing ? (
        <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          No submission was recorded for this question.
        </div>
      ) : null}
    </div>
  );
}
