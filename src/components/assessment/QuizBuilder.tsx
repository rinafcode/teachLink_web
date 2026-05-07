'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Download, CheckCircle2 } from 'lucide-react';
import {
  AssessmentQuestion,
  AssessmentQuestionType,
  QuestionEditor,
  createQuestionTemplate,
  validateQuestion,
} from './QuestionTypes';

interface SortableQuestionProps {
  id: string;
  label: string;
  type: AssessmentQuestionType;
  active: boolean;
  onSelect: () => void;
}

const SortableQuestion: React.FC<SortableQuestionProps> = ({ id, label, type, active, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={onSelect}
      {...attributes}
      {...listeners}
      className={`group flex w-full items-center justify-between gap-3 rounded-3xl border px-4 py-4 text-left transition ${
        active ? 'border-blue-500 bg-blue-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'
      } dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:bg-slate-900`}
    >
      <span>
        <span className="font-semibold">{label}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{type.replace('-', ' ')}</span>
      </span>
      <GripVertical size={18} className="text-slate-400" />
    </button>
  );
};

const QUESTION_TYPES: Array<{ type: AssessmentQuestionType; label: string; description: string }> = [
  { type: 'multiple-choice', label: 'Multiple choice', description: 'Create graded multiple choice questions.' },
  { type: 'true-false', label: 'True / False', description: 'Add simple true or false items.' },
  { type: 'code-challenge', label: 'Code challenge', description: 'Build interactive coding problems with test cases.' },
  { type: 'essay', label: 'Essay', description: 'Design open-ended essay prompts with word limits.' },
];

export function QuizBuilder() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    createQuestionTemplate('multiple-choice'),
  ]);
  const [activeQuestionId, setActiveQuestionId] = useState(questions[0].id);

  const sensors = useSensors(useSensor(PointerSensor));

  const activeQuestion = useMemo(
    () => questions.find((question) => question.id === activeQuestionId) ?? questions[0],
    [questions, activeQuestionId],
  );

  const questionValidation = useMemo(
    () => questions.map((question) => ({ id: question.id, errors: validateQuestion(question) })),
    [questions],
  );

  const invalidQuestions = questionValidation.filter((item) => item.errors.length > 0).length;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((item) => item.id === active.id);
    const newIndex = questions.findIndex((item) => item.id === over.id);
    setQuestions((current) => arrayMove(current, oldIndex, newIndex));
  };

  const addQuestion = (type: AssessmentQuestionType) => {
    const next = createQuestionTemplate(type);
    setQuestions((current) => [...current, next]);
    setActiveQuestionId(next.id);
  };

  const updateQuestion = (updatedQuestion: AssessmentQuestion) => {
    setQuestions((current) => current.map((question) => (question.id === updatedQuestion.id ? updatedQuestion : question)));
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((current) => current.filter((question) => question.id !== questionId));
    if (questionId === activeQuestionId && questions.length > 1) {
      const next = questions.find((question) => question.id !== questionId);
      if (next) setActiveQuestionId(next.id);
    }
  };

  const exportQuiz = async () => {
    const payload = JSON.stringify({ questions, updatedAt: new Date().toISOString() }, null, 2);
    await navigator.clipboard.writeText(payload);
    alert('Quiz definition copied to clipboard.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Interactive Quiz Builder</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Drag questions into place, configure all major assessment types, and preview your adaptive testing flow.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportQuiz}
              className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download size={16} /> Export JSON
            </button>
            <button
              type="button"
              onClick={() => alert('Quiz saved to draft.')} 
              className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <CheckCircle2 size={16} /> Save quiz
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {QUESTION_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addQuestion(item.type)}
                    className="rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-400 dark:hover:bg-slate-900"
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map((question) => question.id)} strategy={rectSortingStrategy}>
                <div className="space-y-3">
                  {questions.map((question) => (
                    <SortableQuestion
                      key={question.id}
                      id={question.id}
                      type={question.type}
                      label={question.text || 'Untitled question'}
                      active={question.id === activeQuestionId}
                      onSelect={() => setActiveQuestionId(question.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <div className="font-semibold">Validation overview</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <div className="text-xs uppercase text-slate-400">Questions</div>
                  <div className="mt-2 text-2xl font-semibold">{questions.length}</div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <div className="text-xs uppercase text-slate-400">Issues</div>
                  <div className="mt-2 text-2xl font-semibold">{invalidQuestions}</div>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <div className="text-xs uppercase text-slate-400">Difficulty average</div>
                  <div className="mt-2 text-2xl font-semibold">{questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Selected question editor</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Edit the currently selected question and see errors live.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{activeQuestion?.type}</div>
            </div>
            {activeQuestion ? (
              <QuestionEditor
                question={activeQuestion}
                onUpdate={updateQuestion}
                onRemove={() => removeQuestion(activeQuestion.id)}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Select a question to edit it.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
