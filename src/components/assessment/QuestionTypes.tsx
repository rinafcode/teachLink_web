'use client';

import { useMemo } from 'react';
import { PlusCircle, Trash2, CheckCircle, Code, AlignLeft, ListChecks } from 'lucide-react';

export type AssessmentQuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'code-challenge'
  | 'essay';

export interface AssessmentOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AssessmentTestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface AssessmentQuestionBase {
  id: string;
  type: AssessmentQuestionType;
  text: string;
  points: number;
  difficulty: number;
  explanation?: string;
}

export interface MultipleChoiceAssessmentQuestion extends AssessmentQuestionBase {
  type: 'multiple-choice';
  options: AssessmentOption[];
}

export interface TrueFalseAssessmentQuestion extends AssessmentQuestionBase {
  type: 'true-false';
  correctAnswer: 'true' | 'false';
}

export interface CodeChallengeAssessmentQuestion extends AssessmentQuestionBase {
  type: 'code-challenge';
  codeTemplate: string;
  language: string;
  testCases: AssessmentTestCase[];
}

export interface EssayAssessmentQuestion extends AssessmentQuestionBase {
  type: 'essay';
  wordLimit: number;
}

export type AssessmentQuestion =
  | MultipleChoiceAssessmentQuestion
  | TrueFalseAssessmentQuestion
  | CodeChallengeAssessmentQuestion
  | EssayAssessmentQuestion;

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createQuestionTemplate(type: AssessmentQuestionType): AssessmentQuestion {
  const base = {
    id: createId(),
    type,
    text: 'New question',
    points: 5,
    difficulty: 3,
    explanation: '',
  };

  switch (type) {
    case 'multiple-choice':
      return {
        ...base,
        type,
        options: [
          { id: createId(), text: 'Option A', isCorrect: true },
          { id: createId(), text: 'Option B', isCorrect: false },
        ],
      };
    case 'true-false':
      return {
        ...base,
        type,
        correctAnswer: 'true',
      };
    case 'code-challenge':
      return {
        ...base,
        type,
        language: 'javascript',
        codeTemplate: `function solution(input) {
  // Write your code here
  return input;
}`,
        testCases: [
          { id: createId(), input: '2', expectedOutput: '4' },
        ],
      };
    case 'essay':
      return {
        ...base,
        type,
        wordLimit: 250,
      };
    default:
      return base as AssessmentQuestion;
  }
}

export function validateQuestion(question: AssessmentQuestion) {
  const errors: string[] = [];
  if (!question.text.trim()) {
    errors.push('Question prompt cannot be empty.');
  }
  if (question.points <= 0) {
    errors.push('Point value must be greater than zero.');
  }
  if (question.difficulty < 1 || question.difficulty > 5) {
    errors.push('Difficulty must be set between 1 and 5.');
  }

  if (question.type === 'multiple-choice') {
    if (question.options.length < 2) {
      errors.push('Multiple choice questions need at least two options.');
    }
    if (!question.options.some((option) => option.isCorrect)) {
      errors.push('At least one option must be marked correct.');
    }
  }

  if (question.type === 'code-challenge') {
    if (!question.codeTemplate.trim()) {
      errors.push('Code challenge must include a starter template.');
    }
    if (question.testCases.length === 0) {
      errors.push('Code challenge questions require at least one test case.');
    }
  }

  if (question.type === 'essay' && question.wordLimit <= 0) {
    errors.push('Essay questions require a positive word limit.');
  }

  return errors;
}

interface QuestionEditorProps {
  question: AssessmentQuestion;
  onUpdate: (question: AssessmentQuestion) => void;
  onRemove: () => void;
}

export function QuestionEditor({ question, onUpdate, onRemove }: QuestionEditorProps) {
  const errors = useMemo(() => validateQuestion(question), [question]);

  const updateBase = <K extends keyof AssessmentQuestionBase>(key: K, value: AssessmentQuestionBase[K]) => {
    onUpdate({ ...question, [key]: value } as AssessmentQuestion);
  };

  const updateMultipleChoiceOption = (optionId: string, value: string) => {
    if (question.type !== 'multiple-choice') return;
    const nextOptions = question.options.map((option) =>
      option.id === optionId ? { ...option, text: value } : option,
    );
    onUpdate({ ...question, options: nextOptions });
  };

  const toggleCorrectOption = (optionId: string) => {
    if (question.type !== 'multiple-choice') return;
    const nextOptions = question.options.map((option) => ({
      ...option,
      isCorrect: option.id === optionId ? !option.isCorrect : option.isCorrect,
    }));
    onUpdate({ ...question, options: nextOptions });
  };

  const addOption = () => {
    if (question.type !== 'multiple-choice') return;
    onUpdate({
      ...question,
      options: [...question.options, { id: createId(), text: 'New option', isCorrect: false }],
    });
  };

  const removeOption = (optionId: string) => {
    if (question.type !== 'multiple-choice') return;
    onUpdate({
      ...question,
      options: question.options.filter((option) => option.id !== optionId),
    });
  };

  const updateTestCase = (testCaseId: string, field: keyof AssessmentTestCase, value: string) => {
    if (question.type !== 'code-challenge') return;
    const testCases = question.testCases.map((testCase) =>
      testCase.id === testCaseId ? { ...testCase, [field]: value } : testCase,
    );
    onUpdate({ ...question, testCases });
  };

  const addTestCase = () => {
    if (question.type !== 'code-challenge') return;
    onUpdate({
      ...question,
      testCases: [
        ...question.testCases,
        { id: createId(), input: 'input', expectedOutput: 'expected output' },
      ],
    });
  };

  const removeTestCase = (testCaseId: string) => {
    if (question.type !== 'code-challenge') return;
    onUpdate({
      ...question,
      testCases: question.testCases.filter((testCase) => testCase.id !== testCaseId),
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{question.type.replace('-', ' ').toUpperCase()}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">ID: {question.id}</div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          <Trash2 size={14} /> Remove question
        </button>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Question prompt
          <textarea
            value={question.text}
            onChange={(event) => updateBase('text', event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Points
            <input
              type="number"
              value={question.points}
              min={1}
              onChange={(event) => updateBase('points', Number(event.target.value))}
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Difficulty
            <select
              value={question.difficulty}
              onChange={(event) => updateBase('difficulty', Number(event.target.value))}
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} – {value <= 2 ? 'Easy' : value === 3 ? 'Medium' : 'Hard'}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Explanation (optional)
            <input
              type="text"
              value={question.explanation ?? ''}
              onChange={(event) => updateBase('explanation', event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </label>
        </div>

        {question.type === 'multiple-choice' ? (
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ListChecks size={16} /> Answer options
            </div>
            {question.options.map((option) => (
              <div key={option.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={option.text}
                  onChange={(event) => updateMultipleChoiceOption(option.id, event.target.value)}
                  className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Mark correct answer"
                    onClick={() => toggleCorrectOption(option.id)}
                    className={`inline-flex h-12 items-center justify-center rounded-3xl px-4 text-sm font-semibold transition ${
                      option.isCorrect
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    className="inline-flex h-12 items-center justify-center rounded-3xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <PlusCircle size={16} /> Add option
            </button>
          </div>
        ) : question.type === 'true-false' ? (
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Correct answer</div>
            <div className="flex gap-3">
              {(['true', 'false'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateBase('correctAnswer', value)}
                  className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
                    question.correctAnswer === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ) : question.type === 'code-challenge' ? (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Language
                <input
                  value={question.language}
                  onChange={(event) => onUpdate({ ...question, language: event.target.value })}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Word points
                <input
                  type="number"
                  value={question.points}
                  min={1}
                  onChange={(event) => updateBase('points', Number(event.target.value))}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Starter template
              <textarea
                value={question.codeTemplate}
                onChange={(event) => onUpdate({ ...question, codeTemplate: event.target.value })}
                rows={6}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
              />
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Code size={16} /> Test cases
              </div>
              {question.testCases.map((testCase) => (
                <div key={testCase.id} className="grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    value={testCase.input}
                    onChange={(event) => updateTestCase(testCase.id, 'input', event.target.value)}
                    className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    placeholder="Input"
                  />
                  <input
                    value={testCase.expectedOutput}
                    onChange={(event) => updateTestCase(testCase.id, 'expectedOutput', event.target.value)}
                    className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    placeholder="Expected output"
                  />
                  <button
                    type="button"
                    onClick={() => removeTestCase(testCase.id)}
                    className="inline-flex items-center justify-center rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Trash2 size={16} /> Remove test case
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTestCase}
                className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <PlusCircle size={16} /> Add test case
              </button>
            </div>
          </div>
        ) : question.type === 'essay' ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <AlignLeft size={16} /> Essay settings
            </div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Word limit
              <input
                type="number"
                value={question.wordLimit}
                min={100}
                onChange={(event) => onUpdate({ ...question, wordLimit: Number(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
              />
            </label>
          </div>
        ) : null}

        {errors.length > 0 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <div className="font-semibold">Validation issues</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
