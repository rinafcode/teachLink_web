import { describe, it, expect } from 'vitest';
import { UserSchema } from '../schemas/user.schema';
import { CourseSchema } from '../schemas/course.schema';
import { validateData, ValidationError } from '../lib/validation/validator';

describe('Data Validation', () => {
  describe('UserSchema', () => {
    it('should validate a correct user object', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'STUDENT',
      };

      const result = UserSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it('should throw error for invalid email', () => {
      const invalidUser = {
        id: '1',
        name: 'John Doe',
        email: 'not-an-email',
        role: 'STUDENT',
      };

      expect(() => UserSchema.parse(invalidUser)).toThrow();
    });

    it('should throw error for invalid role', () => {
      const invalidUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'SUPERMAN',
      };

      expect(() => UserSchema.parse(invalidUser)).toThrow();
    });
  });

  describe('CourseSchema', () => {
    it('should validate a correct course object', () => {
      const validCourse = {
        id: 'course-1',
        title: 'Intro to Zod',
        description: 'A comprehensive guide to Zod validation.',
        instructor: 'Jane Smith',
        duration: '2h 30m',
        totalLessons: 10,
        progress: 0,
        category: 'Programming',
        thumbnailUrl: '/thumbnails/zod.png',
        downloaded: false,
      };

      const result = CourseSchema.parse(validCourse);
      expect(result).toEqual(validCourse);
    });

    it('should throw error for short description', () => {
      const invalidCourse = {
        id: 'course-1',
        title: 'Intro to Zod',
        description: 'Too short',
        instructor: 'Jane Smith',
        duration: '2h 30m',
        totalLessons: 10,
        progress: 0,
        category: 'Programming',
        thumbnailUrl: '/thumbnails/zod.png',
        downloaded: false,
      };

      expect(() => CourseSchema.parse(invalidCourse)).toThrow();
    });
  });

  describe('validateData utility', () => {
    it('should return validated data when correct', () => {
      const validUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'STUDENT',
      };

      const result = validateData(UserSchema, validUser);
      expect(result).toEqual(validUser);
    });

    it('should throw ValidationError when incorrect', () => {
      const invalidUser = {
        id: '1',
        name: 'J', // too short
        email: 'john@example.com',
        role: 'STUDENT',
      };

      expect(() => validateData(UserSchema, invalidUser)).toThrow(ValidationError);
    });
  });
});
