'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft, Activity, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  AssessmentQuestion,
  AssessmentQuestionType,
  createQuestionTemplate,
  AssessmentOption,
  AssessmentTestCase,
} from './QuestionTypes';

const SAMPLE_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'adaptive-1',
    type: 'multiple-choice',
    text: 'Which sentence describes an adaptive assessment?',
    points: 5,
    difficulty: 2,
    explanation: 'Adaptive assessments adjust question difficulty based on learner performance.',
    options: [
      { id: 'a', text: 'Same test for everyone', isCorrect: false },
      { id: 'b', text: 'Question difficulty adapts to answers', isCorrect: true },
      { id: 'c', text: 'Only one question is shown', isCorrect: false },
    ],
  },
  {
    id: 'adaptive-2',
    type: 'true-false',
    text: 'Adaptive testing can help identify a student’s zone of proximal development.',
    points: 5,
    difficulty: 3,
    correctAnswer: 'true',
    explanation: 'Adaptive questions focus on appropriate challenge levels.',
  },
  {
    id: 'adaptive-3',
    type: 'code-challenge',
    text: 'Write a function that returns the sum of two numbers.',
    points: 10,
    difficulty: 4,
    language: 'javascript',
    codeTemplate: 'function solution(a, b) {
  return a + b;
}',
    testCases: [
      { id: 't1', input: '1,2', expectedOutput: '3' },
      { id: 't2', input: '-1,4', expectedOutput: '3' },
    ],
    explanation: 'The function should add numeric inputs and return the result.',
  },
  {
    id: 'adaptive-4',
    type: 'essay',
    text: 'Describe one advantage of adaptive testing for personalised learning.',
    points: 8,
    difficulty: 5,
    wordLimit: 150,
    explanation: 'Essay reflections provide evidence of mastery and strategy awareness.',
  },
];

const getCorrectAnswer = (question: AssessmentQuestion, answer: string) => {
  if (question.type === 'multiple-choice') {
    return question.options.some((option) => option.id === answer && option.isCorrect);
  }
  if (question.type === 'true-false') {
    return question.correctAnswer === answer;
  }
  if (question.type === 'code-challenge') {
    return question.testCases.every((testCase) => answer.includes(testCase.expectedOutput));
  }
  if (question.type === 'essay') {
    return answer.trim().length > 0;
  }
  return false;
};

const pickNextQuestion = (
  pool: AssessmentQuestion[],
  previousQuestionId: string,
  desiredDifficulty: number,
) => {
  const remaining = pool.filter((item) => item.id !== previousQuestionId);
  const sorted = remaining.sort(
    (a, b) =>
      Math.abs(a.difficulty - desiredDifficulty) - Math.abs(b.difficulty - desiredDifficulty),
  );
  return sorted[0] ?? null;
};

export function AdaptiveTesting() {
  const [activeQuestion, setActiveQuestion] = useState<AssessmentQuestion | null>(null);
  const [history, setHistory] = useState<{
    question: AssessmentQuestion;
    answer: string;
    correct: boolean;
  }[]>([]);
  const [answerDraft, setAnswerDraft] = useState('');
  const [difficultyTarget, setDifficultyTarget] = useState(3);
  const [isRunning, setIsRunning] = useState(false);

  const startAssessment = () => {
    setHistory([]);
    setDifficultyTarget(3);
    setAnswerDraft('');
    setActiveQuestion(SAMPLE_QUESTIONS[0]);
    setIsRunning(true);
  };

  const currentDifficultyLabel = (value: number) =>
    value <= 2 ? 'Easy' : value === 3 ? 'Medium' : 'Hard';

  const submitAnswer = () => {
    if (!activeQuestion) return;
    const correct = getCorrectAnswer(activeQuestion, answerDraft);
    const nextDifficulty = Math.max(1, Math.min(5, activeQuestion.difficulty + (correct ? 1 : -1)));
    const nextQuestion = pickNextQuestion(SAMPLE_QUESTIONS, activeQuestion.id, nextDifficulty);

    setHistory((current) => [
      ...current,
      { question: activeQuestion, answer: answerDraft, correct },
    ]);
    setDifficultyTarget(nextDifficulty);
    setAnswerDraft('');
    setActiveQuestion(nextQuestion);
    if (!nextQuestion) {
      setIsRunning(false);
    }
  };

  const totalScore = useMemo(
    () => history.reduce((sum, item) => sum + (item.correct ? item.question.points : 0), 0),
    [history],
  );

  const maxPossible = useMemo(
    () => history.reduce((sum, item) => sum + item.question.points, 0),
    [history],
  );

  const progress = useMemo(
    () => (history.length / SAMPLE_QUESTIONS.length) * 100,
    [history.length],
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Adaptive Testing</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">An intelligent assessment mode that adjusts question difficulty in real time based on performance.</p>
        </div>
        <button
          type="button"
          onClick={startAssessment}
          className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Zap size={16} /> Start adaptive session
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_0.6fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Current difficulty goal</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{currentDifficultyLabel(difficultyTarget)}</div>
              </div>
              <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                Target level {difficultyTarget}
              </div>
            </div>
          </div>

          {!isRunning && history.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              Click &ldquo;Start adaptive session&rdquo; to practice a dynamically curated quiz path.
            </div>
          ) : activeQuestion ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Question {history.length + 1} of {SAMPLE_QUESTIONS.length}</div>
                  <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{activeQuestion.text}</div>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Difficulty {activeQuestion.difficulty}</div>
              </div>

              <div className="mt-5 space-y-4">
                {activeQuestion.type === 'multiple-choice' ? (
                  <div className="space-y-3">
                    {activeQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAnswerDraft(option.id)}
                        className={`w-full rounded-3xl border px-4 py-3 text-left text-sm transition ${
                          answerDraft === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-400'
                        }`}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                ) : activeQuestion.type === 'true-false' ? (
                  <div className="flex gap-3">
                    {(['true', 'false'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAnswerDraft(value)}
                        className={`flex-1 rounded-3xl px-4 py-4 text-sm font-semibold transition ${
                          answerDraft === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                ) : activeQuestion.type === 'code-challenge' ? (
                  <div className="space-y-3">
                    <pre className="rounded-3xl bg-slate-950 p-4 text-sm text-slate-100 overflow-x-auto">{activeQuestion.codeTemplate}</pre>
                    <textarea
                      rows={8}
                      value={answerDraft}
                      onChange={(event) => setAnswerDraft(event.target.value)}
                      className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                      placeholder="Write your code here..."
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      rows={8}
                      value={answerDraft}
                      onChange={(event) => setAnswerDraft(event.target.value)}
                      className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                      placeholder="Write your essay response here..."
                    />
                    <div className="text-xs text-slate-500 dark:text-slate-400">Word limit: {activeQuestion.wordLimit}</div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!answerDraft}
                  className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowRight size={16} /> Submit answer
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              {history.length > 0 ? 'The adaptive session is complete. Review your performance summary to see how difficulty adjusted.' : 'No active question. Start the adaptive session to begin.'}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Activity size={18} /> Performance summary
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Answered</span>
                <span>{history.length}/{SAMPLE_QUESTIONS.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total score</span>
                <span>{totalScore}/{maxPossible}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Recent history</div>
                <div className="mt-3 space-y-2">
                  {history.slice(-3).map((item, index) => (
                    <div key={`${item.question.id}-${index}`} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <span className="truncate">{item.question.text}</span>
                      <span className={item.correct ? 'text-emerald-600' : 'text-red-600'}>
                        {item.correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  ))}
                  {!history.length && <div className="text-slate-500 dark:text-slate-400">No answers yet.</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Zap size={18} /> Difficulty adaptation
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
                <div className="font-semibold">Target difficulty</div>
                <div className="mt-2 text-2xl">{difficultyTarget}</div>
              </div>
              <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
                <div className="font-semibold">Adaptation rule</div>
                <p className="mt-2">Correct answer increases challenge; incorrect answer routes the student to a more accessible level.</p>
              </div>
              {history.length > 0 && (
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  Last response: {history[history.length - 1].correct ? 'Correct' : 'Incorrect'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
