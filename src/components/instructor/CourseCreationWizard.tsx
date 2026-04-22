'use client';

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useCourseCreation, Lesson } from '@/hooks/useCourseCreation';
import { ContentUploader } from './ContentUploader';
import { LessonBuilder } from './LessonBuilder';
import { AssessmentCreator } from './AssessmentCreator';

const STEPS = [
  { id: 0, name: 'Basic Info', description: 'Course details' },
  { id: 1, name: 'Lessons', description: 'Build curriculum' },
  { id: 2, name: 'Content', description: 'Upload materials' },
  { id: 3, name: 'Assessments', description: 'Create quizzes' },
  { id: 4, name: 'Preview', description: 'Review & publish' },
];

export const CourseCreationWizard = () => {
  const {
    currentStep,
    courseData,
    updateCourseData,
    addLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    addAssessment,
    nextStep,
    previousStep,
    goToStep,
  } = useCourseCreation();

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content: [] });

  const handleSaveLesson = () => {
    if (!lessonForm.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }
    addLesson(lessonForm);
    setLessonForm({ title: '', description: '', content: [] });
    setShowLessonForm(false);
  };

  const handleContentUpload = (file: File, type: 'video' | 'text' | 'pdf') => {};

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl font-bold sm:text-2xl">Course Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseData.title}
                  onChange={(e) => updateCourseData({ title: e.target.value })}
                  placeholder="e.g., Introduction to Web Development"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={courseData.description}
                  onChange={(e) => updateCourseData({ description: e.target.value })}
                  placeholder="Describe what students will learn..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={courseData.category}
                    onChange={(e) => updateCourseData({ category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Difficulty Level
                  </label>
                  <select
                    value={courseData.level}
                    onChange={(e) => updateCourseData({ level: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pricing
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={courseData.pricing.type === 'free'}
                      onChange={() => updateCourseData({ pricing: { type: 'free' } })}
                      className="mr-2"
                    />
                    Free
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={courseData.pricing.type === 'paid'}
                      onChange={() => updateCourseData({ pricing: { type: 'paid', amount: 0 } })}
                      className="mr-2"
                    />
                    Paid
                  </label>
                </div>
                {courseData.pricing.type === 'paid' && (
                  <input
                    type="number"
                    value={courseData.pricing.amount || 0}
                    onChange={(e) =>
                      updateCourseData({
                        pricing: { type: 'paid', amount: Number(e.target.value) },
                      })
                    }
                    placeholder="Price in USD"
                    className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl font-bold sm:text-2xl">Build Your Curriculum</h2>
            {showLessonForm ? (
              <div className="p-4 bg-white border rounded-lg sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="mb-4 text-lg font-semibold dark:text-white">New Lesson</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="Lesson title"
                    className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    placeholder="Lesson description"
                    rows={3}
                    className="w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveLesson}
                      className="px-4 py-2 text-white bg-blue-600 rounded-md"
                    >
                      Save Lesson
                    </button>
                    <button
                      onClick={() => setShowLessonForm(false)}
                      className="px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <LessonBuilder
                lessons={courseData.lessons}
                onReorder={reorderLessons}
                onEdit={setEditingLesson}
                onDelete={deleteLesson}
                onAdd={() => setShowLessonForm(true)}
              />
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl font-bold sm:text-2xl">Upload Course Content</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Add videos, PDFs, and other learning materials for your lessons.
            </p>
            <ContentUploader onUpload={handleContentUpload} />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl font-bold sm:text-2xl">Create Assessments</h2>
            <AssessmentCreator onSave={addAssessment} />
            {courseData.assessments.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-semibold dark:text-white">Saved Assessments</h3>
                <div className="space-y-2">
                  {courseData.assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-4 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium dark:text-white">{assessment.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {assessment.questions.length} questions
                          </p>
                        </div>
                        <span className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                          {assessment.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl font-bold sm:text-2xl">Preview & Publish</h2>
            <div className="p-4 space-y-4 bg-white border rounded-lg sm:p-6 dark:bg-gray-800 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold sm:text-xl dark:text-white">
                  {courseData.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{courseData.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="dark:text-gray-300">
                  <span className="font-medium">Category:</span> {courseData.category}
                </div>
                <div className="dark:text-gray-300">
                  <span className="font-medium">Level:</span> {courseData.level}
                </div>
                <div className="dark:text-gray-300">
                  <span className="font-medium">Lessons:</span> {courseData.lessons.length}
                </div>
                <div className="dark:text-gray-300">
                  <span className="font-medium">Assessments:</span> {courseData.assessments.length}
                </div>
              </div>
              <div className="pt-4 border-t">
                <button className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                  Publish Course
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl p-4 mx-auto sm:p-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between pb-4 overflow-x-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-colors text-sm sm:text-base ${
                    currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4 sm:h-5 sm:w-5" />
                  ) : (
                    step.id + 1
                  )}
                </button>
                <div className="hidden mt-2 text-center sm:block">
                  <div className="text-sm font-medium">{step.name}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                <div className="mt-1 text-center sm:hidden">
                  <div className="text-xs font-medium">{step.name}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 sm:mx-4 transition-colors ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 sm:p-8 min-h-[400px] sm:min-h-[500px]">
        {renderStepContent()}
      </div>

      <div className="flex justify-between gap-2 mt-4 sm:mt-6">
        <button
          onClick={previousStep}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg sm:gap-2 sm:px-6 sm:py-3 dark:border-gray-600 dark:bg-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>
        <button
          onClick={nextStep}
          disabled={currentStep === STEPS.length - 1}
          className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg sm:gap-2 sm:px-6 sm:py-3 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed sm:text-base"
        >
          Next
          <ChevronRight className="w-4 h-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
};
