'use client';

import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Assessment } from '@/hooks/useCourseCreation';

interface AssessmentCreatorProps {
  onSave: (assessment: Omit<Assessment, 'id'>) => void;
  initialData?: Assessment;
}

export const AssessmentCreator: React.FC<AssessmentCreatorProps> = ({
  onSave,
  initialData
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<'quiz' | 'assignment'>(initialData?.type || 'quiz');
  const [questions, setQuestions] = useState(
    initialData?.questions || []
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        question: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1
      }
    ]);
  };

  const updateQuestion = (index: number, updates: any) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    onSave({ title, type, questions });
    setTitle('');
    setQuestions([]);
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assessment Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Module 1 Quiz"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assessment Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'quiz' | 'assignment')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold dark:text-white">Questions</h4>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No questions yet. Click &quot;Add Question&quot; to start.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Question {index + 1}
                  </span>
                  <button
                    onClick={() => deleteQuestion(index)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) =>
                        updateQuestion(index, { question: e.target.value })
                      }
                      placeholder="Enter your question"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Question Type
                      </label>
                      <select
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(index, {
                            type: e.target.value,
                            options: e.target.value === 'true-false' ? ['True', 'False'] : q.options
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="essay">Essay</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Points</label>
                      <input
                        type="number"
                        value={q.points}
                        onChange={(e) =>
                          updateQuestion(index, { points: Number(e.target.value) })
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {(q.type === 'multiple-choice' || q.type === 'true-false') && (
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Options (select correct answer)
                      </label>
                      <div className="space-y-2">
                        {q.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={q.correctAnswer === optIndex}
                              onChange={() =>
                                updateQuestion(index, { correctAnswer: optIndex })
                              }
                              className="h-4 w-4 text-blue-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(q.options || [])];
                                newOptions[optIndex] = e.target.value;
                                updateQuestion(index, { options: newOptions });
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm disabled:opacity-50"
                              disabled={q.type === 'true-false'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          Save Assessment
        </button>
      </div>
    </div>
  );
};
