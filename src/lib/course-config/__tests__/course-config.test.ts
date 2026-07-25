import { describe, it, expect } from 'vitest';
import {
  getCourseListConfig,
  setCourseListConfig,
  resetCourseListConfig,
  getAllCourses,
  getFeaturedCourses,
  getCourseById,
  getCoursesByCategory,
  getCoursesByTag,
  getPaginatedCourses,
} from '..';
import { createDefaultCourseListConfig } from '../types';

describe('course-list config', () => {
  beforeEach(() => {
    resetCourseListConfig();
  });

  describe('getCourseListConfig', () => {
    it('returns default config', () => {
      const config = getCourseListConfig();
      expect(config.version).toBe(1);
      expect(config.courses).toHaveLength(6);
      expect(config.itemsPerPage).toBe(10);
    });

    it('memoizes the config', () => {
      const a = getCourseListConfig();
      const b = getCourseListConfig();
      expect(a).toBe(b);
    });
  });

  describe('setCourseListConfig', () => {
    it('replaces the config with valid data', () => {
      const custom = createDefaultCourseListConfig();
      custom.itemsPerPage = 5;
      custom.courses = custom.courses.slice(0, 1);
      setCourseListConfig(custom);
      const config = getCourseListConfig();
      expect(config.itemsPerPage).toBe(5);
      expect(config.courses).toHaveLength(1);
    });

    it('ignores invalid config', () => {
      const original = getCourseListConfig();
      // @ts-expect-error intentionally invalid
      setCourseListConfig({ version: 99, courses: 'invalid' });
      const config = getCourseListConfig();
      expect(config).toBe(original);
    });
  });

  describe('getAllCourses', () => {
    it('returns all courses', () => {
      const courses = getAllCourses();
      expect(courses).toHaveLength(6);
    });

    it('returns courses after config update', () => {
      const custom = createDefaultCourseListConfig();
      custom.courses = [];
      setCourseListConfig(custom);
      expect(getAllCourses()).toHaveLength(0);
    });
  });

  describe('getFeaturedCourses', () => {
    it('returns only featured courses by default', () => {
      const featured = getFeaturedCourses();
      expect(featured.length).toBeGreaterThan(0);
      featured.forEach((c) => {
        expect(c.featured).toBe(true);
      });
    });

    it('respects the max limit', () => {
      const featured = getFeaturedCourses(2);
      expect(featured).toHaveLength(2);
    });
  });

  describe('getCourseById', () => {
    it('finds a course by id', () => {
      const course = getCourseById('1');
      expect(course).toBeDefined();
      expect(course?.title).toContain('Web3');
    });

    it('returns undefined for missing id', () => {
      expect(getCourseById('nonexistent')).toBeUndefined();
    });
  });

  describe('getCoursesByCategory', () => {
    it('filters by category', () => {
      const design = getCoursesByCategory('Design');
      expect(design.length).toBeGreaterThan(0);
      design.forEach((c) => {
        expect(c.category.toLowerCase()).toBe('design');
      });
    });

    it('is case insensitive', () => {
      const a = getCoursesByCategory('Design');
      const b = getCoursesByCategory('design');
      expect(a).toEqual(b);
    });
  });

  describe('getCoursesByTag', () => {
    it('filters by tag', () => {
      const web3 = getCoursesByTag('web3');
      expect(web3).toHaveLength(1);
      expect(web3[0].id).toBe('1');
    });
  });

  describe('getPaginatedCourses', () => {
    it('returns all courses by default', () => {
      const result = getPaginatedCourses();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBe(6);
      expect(result.nextCursor).toBeUndefined();
    });

    it('paginates correctly', () => {
      const page1 = getPaginatedCourses(2);
      expect(page1.data).toHaveLength(2);
      expect(page1.nextCursor).toBe('2');

      const page2 = getPaginatedCourses(2, '2');
      expect(page2.data).toHaveLength(2);
      expect(page2.nextCursor).toBe('4');
    });

    it('returns undefined nextCursor on last page', () => {
      const result = getPaginatedCourses(100);
      expect(result.nextCursor).toBeUndefined();
    });

    it('supports featured filter', () => {
      const featured = getPaginatedCourses(10, undefined, { featured: true });
      expect(featured.data.length).toBeGreaterThan(0);
      featured.data.forEach((c) => expect(c.featured).toBe(true));

      const nonFeatured = getPaginatedCourses(10, undefined, { featured: false });
      nonFeatured.data.forEach((c) => expect(c.featured).toBe(false));
    });

    it('clamps limit between 1 and 100', () => {
      const small = getPaginatedCourses(0);
      expect(small.data.length).toBeGreaterThanOrEqual(1);

      const huge = getPaginatedCourses(200);
      expect(huge.data.length).toBeLessThanOrEqual(100);
    });
  });
});
