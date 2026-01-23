'use client';

import { useState, useCallback } from 'react';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  content: {
    type: 'video' | 'text' | 'pdf' | 'quiz';
    url?: string;
    text?: string;
  }[];
}

export interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'assignment';
  questions: {
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
    options?: string[];
    correctAnswer?: string | number;
    points: number;
  }[];
}

export interface CourseData {
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnail?: File;
  lessons: Lesson[];
  assessments: Assessment[];
  pricing: {
    type: 'free' | 'paid';
    amount?: number;
  };
}

export const useCourseCreation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    lessons: [],
    assessments: [],
    pricing: { type: 'free' }
  });

  const updateCourseData = useCallback((data: Partial<CourseData>) => {
    setCourseData(prev => ({ ...prev, ...data }));
  }, []);

  const addLesson = useCallback((lesson: Omit<Lesson, 'id' | 'order'>) => {
    const newLesson: Lesson = {
      ...lesson,
      id: `lesson-${Date.now()}`,
      order: courseData.lessons.length
    };
    setCourseData(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }));
  }, [courseData.lessons.length]);

  const updateLesson = useCallback((id: string, updates: Partial<Lesson>) => {
    setCourseData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson =>
        lesson.id === id ? { ...lesson, ...updates } : lesson
      )
    }));
  }, []);

  const deleteLesson = useCallback((id: string) => {
    setCourseData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(lesson => lesson.id !== id)
    }));
  }, []);

  const reorderLessons = useCallback((lessons: Lesson[]) => {
    setCourseData(prev => ({
      ...prev,
      lessons: lessons.map((lesson, index) => ({ ...lesson, order: index }))
    }));
  }, []);

  const addAssessment = useCallback((assessment: Omit<Assessment, 'id'>) => {
    const newAssessment: Assessment = {
      ...assessment,
      id: `assessment-${Date.now()}`
    };
    setCourseData(prev => ({
      ...prev,
      assessments: [...prev.assessments, newAssessment]
    }));
  }, []);

  const updateAssessment = useCallback((id: string, updates: Partial<Assessment>) => {
    setCourseData(prev => ({
      ...prev,
      assessments: prev.assessments.map(assessment =>
        assessment.id === id ? { ...assessment, ...updates } : assessment
      )
    }));
  }, []);

  const deleteAssessment = useCallback((id: string) => {
    setCourseData(prev => ({
      ...prev,
      assessments: prev.assessments.filter(assessment => assessment.id !== id)
    }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  return {
    currentStep,
    courseData,
    updateCourseData,
    addLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    addAssessment,
    updateAssessment,
    deleteAssessment,
    nextStep,
    previousStep,
    goToStep
  };
};
