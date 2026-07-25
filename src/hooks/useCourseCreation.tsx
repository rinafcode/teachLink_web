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

export interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  usedCount: number;
  description?: string;
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
  discounts: Discount[];
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
    pricing: { type: 'free' },
    discounts: [],
  });

  const updateCourseData = useCallback((data: Partial<CourseData>) => {
    setCourseData((prev) => ({ ...prev, ...data }));
  }, []);

  const addLesson = useCallback(
    (lesson: Omit<Lesson, 'id' | 'order'>) => {
      const newLesson: Lesson = {
        ...lesson,
        id: `lesson-${Date.now()}`,
        order: courseData.lessons.length,
      };
      setCourseData((prev) => ({
        ...prev,
        lessons: [...prev.lessons, newLesson],
      }));
    },
    [courseData.lessons.length],
  );

  const updateLesson = useCallback((id: string, updates: Partial<Lesson>) => {
    setCourseData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson) =>
        lesson.id === id ? { ...lesson, ...updates } : lesson,
      ),
    }));
  }, []);

  const deleteLesson = useCallback((id: string) => {
    setCourseData((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((lesson) => lesson.id !== id),
    }));
  }, []);

  const reorderLessons = useCallback((lessons: Lesson[]) => {
    setCourseData((prev) => ({
      ...prev,
      lessons: lessons.map((lesson, index) => ({ ...lesson, order: index })),
    }));
  }, []);

  const addAssessment = useCallback((assessment: Omit<Assessment, 'id'>) => {
    const newAssessment: Assessment = {
      ...assessment,
      id: `assessment-${Date.now()}`,
    };
    setCourseData((prev) => ({
      ...prev,
      assessments: [...prev.assessments, newAssessment],
    }));
  }, []);

  const updateAssessment = useCallback((id: string, updates: Partial<Assessment>) => {
    setCourseData((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment) =>
        assessment.id === id ? { ...assessment, ...updates } : assessment,
      ),
    }));
  }, []);

  const deleteAssessment = useCallback((id: string) => {
    setCourseData((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((assessment) => assessment.id !== id),
    }));
  }, []);

  const addDiscount = useCallback((discount: Omit<Discount, 'id' | 'usedCount'>) => {
    const newDiscount: Discount = {
      ...discount,
      id: `discount-${Date.now()}`,
      usedCount: 0,
    };
    setCourseData((prev) => ({
      ...prev,
      discounts: [...prev.discounts, newDiscount],
    }));
  }, []);

  const updateDiscount = useCallback((id: string, updates: Partial<Discount>) => {
    setCourseData((prev) => ({
      ...prev,
      discounts: prev.discounts.map((discount) =>
        discount.id === id ? { ...discount, ...updates } : discount,
      ),
    }));
  }, []);

  const deleteDiscount = useCallback((id: string) => {
    setCourseData((prev) => ({
      ...prev,
      discounts: prev.discounts.filter((discount) => discount.id !== id),
    }));
  }, []);

  const incrementDiscountUsage = useCallback((id: string) => {
    setCourseData((prev) => ({
      ...prev,
      discounts: prev.discounts.map((discount) =>
        discount.id === id ? { ...discount, usedCount: discount.usedCount + 1 } : discount,
      ),
    }));
  }, []);

  const calculateDiscountedPrice = useCallback(
    (originalPrice: number, courseDiscounts: Discount[]) => {
      const activeDiscounts = courseDiscounts.filter((d) => {
        if (!d.isActive) return false;
        if (d.startDate && new Date(d.startDate) > new Date()) return false;
        if (d.endDate && new Date(d.endDate) < new Date()) return false;
        if (d.maxUses && d.usedCount >= d.maxUses) return false;
        return true;
      });

      if (activeDiscounts.length === 0) return originalPrice;

      let bestDiscount = 0;
      activeDiscounts.forEach((discount) => {
        let discountAmount = 0;
        if (discount.type === 'percentage') {
          discountAmount = originalPrice * (discount.value / 100);
        } else {
          discountAmount = discount.value;
        }
        if (discountAmount > bestDiscount) {
          bestDiscount = discountAmount;
        }
      });

      return Math.max(0, originalPrice - bestDiscount);
    },
    [],
  );

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
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
    addDiscount,
    updateDiscount,
    deleteDiscount,
    incrementDiscountUsage,
    calculateDiscountedPrice,
    nextStep,
    previousStep,
    goToStep,
  };
};
