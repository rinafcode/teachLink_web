'use client';

import { useMemo, useState } from 'react';
import {
  normalizeQuizOutput,
  type CodeChallengeQuizQuestion,
  type UseQuizReturn,
} from '@/hooks/useQuiz';

interface CodeChallengeQuestionProps {
  question: CodeChallengeQuizQuestion;
  quizState: UseQuizReturn;
}

export default function CodeChallengeQuestion({ question, quizState }: CodeChallengeQuestionProps) {
  const { answers, isReviewMode, isCompleted, actions } = quizState;
  const existing = answers[question.id];

  const [code, setCode] = useState<string>(existing?.value ?? question.codeTemplate ?? '');
  const [testResults, setTestResults] = useState<boolean[]>(
    (existing?.meta?.testResults as boolean[] | undefined) ?? [],
  );
  const [isRunning, setIsRunning] = useState(false);

  const hasTestCases = Boolean(question.testCases && question.testCases.length);
  const passedTests = testResults.filter(Boolean).length;
  const totalTests = testResults.length;

  const overallPassed = useMemo(
    () => (testResults.length ? testResults.every(Boolean) : false),
    [testResults],
  );
  const partialPass =
    totalTests > 0 &&
    passedTests > 0 &&
    !overallPassed &&
    Boolean(question.gradingPolicy?.partialCredit);

  const runTests = () => {
    if (!hasTestCases || !question.testCases) return;

    setIsRunning(true);

    try {
      const userFunction = new Function('input', code) as (input: string) => unknown;
      const results = question.testCases.map((testCase) => {
        try {
          const output = userFunction(testCase.input);
          return (
            normalizeQuizOutput(output, question.gradingPolicy) ===
            normalizeQuizOutput(testCase.expectedOutput, question.gradingPolicy)
          );
        } catch {
          return false;
        }
      });

      setTestResults(results);
      actions.setCodeChallengeResult(question.id, { code, testResults: results });
    } catch {
      const results = question.testCases.map(() => false);
      setTestResults(results);
      actions.setCodeChallengeResult(question.id, { code, testResults: results });
    } finally {
      setIsRunning(false);
    }
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
              overallPassed
                ? 'text-[#0066FF] dark:text-[#00C2FF]'
                : partialPass
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-red-700'
            }`}
          >
            {overallPassed
              ? 'All tests passed'
              : partialPass
                ? `${passedTests} of ${totalTests} tests passed`
                : 'Some tests failed'}
          </div>

          {partialPass && question.gradingPolicy?.partialCredit ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              This submission is partially correct. The grader will tolerate the failed tests and
              award partial credit.
            </div>
          ) : null}

          {question.testCases.map((testCase, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                testResults[index]
                  ? 'bg-[#F0F9FF] dark:bg-[#1E3A8A]/20 border-[#0066FF]/20 dark:border-[#00C2FF]/20'
                  : partialPass
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-700'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-[#0F172A] dark:text-white">
                    Test Case {index + 1}
                  </div>
                  <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    Input: {testCase.input}
                  </div>
                  <div className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                    Expected: {testCase.expectedOutput}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    testResults[index]
                      ? 'text-[#0066FF] dark:text-[#00C2FF]'
                      : partialPass
                        ? 'text-amber-700 dark:text-amber-300'
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
