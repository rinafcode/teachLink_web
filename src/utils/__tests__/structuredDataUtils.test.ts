/**
 * Unit tests for Structured Data utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateFilterStructuredData,
  generateBreadcrumbStructuredData,
  generateFilterGroupStructuredData,
  validateStructuredData,
  type StructuredDataFilterGroup,
} from '../structuredDataUtils';

describe('structuredDataUtils', () => {
  describe('generateFilterStructuredData', () => {
    it('should generate valid JSON-LD for filter groups', () => {
      const filterGroups: StructuredDataFilterGroup[] = [
        {
          id: 'difficulty',
          name: 'Difficulty Level',
          description: 'Filter by difficulty',
          type: 'checkbox',
          options: [
            { id: 'beginner', label: 'Beginner', description: 'Entry level' },
            { id: 'advanced', label: 'Advanced', description: 'Expert level' },
          ],
        },
      ];

      const result = generateFilterStructuredData(filterGroups);
      const parsed = JSON.parse(result);

      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('FilterControls');
      expect(parsed.name).toBe('Search Filters');
      expect(parsed.itemListElement).toHaveLength(1);
      expect(parsed.itemListElement[0].name).toBe('Difficulty Level');
    });

    it('should handle multiple filter groups', () => {
      const filterGroups: StructuredDataFilterGroup[] = [
        {
          id: 'difficulty',
          name: 'Difficulty',
          type: 'checkbox',
          options: [{ id: 'beginner', label: 'Beginner' }],
        },
        {
          id: 'price',
          name: 'Price',
          type: 'range',
          options: [{ id: 'price', label: 'Price', value: '100' }],
        },
      ];

      const result = generateFilterStructuredData(filterGroups);
      const parsed = JSON.parse(result);

      expect(parsed.itemListElement).toHaveLength(2);
    });

    it('should include option details in itemListElement', () => {
      const filterGroups: StructuredDataFilterGroup[] = [
        {
          id: 'topics',
          name: 'Topics',
          type: 'multiselect',
          options: [
            { id: 'coding', label: 'Coding', description: 'Programming topics' },
            { id: 'design', label: 'Design', description: 'Design topics' },
          ],
        },
      ];

      const result = generateFilterStructuredData(filterGroups);
      const parsed = JSON.parse(result);

      expect(parsed.itemListElement[0].itemListElement).toHaveLength(2);
      expect(parsed.itemListElement[0].itemListElement[0].name).toBe('Coding');
      expect(parsed.itemListElement[0].itemListElement[0].identifier).toBe('coding');
    });
  });

  describe('generateBreadcrumbStructuredData', () => {
    it('should generate valid breadcrumb JSON-LD', () => {
      const items = [
        { name: 'Home', url: 'https://example.com' },
        { name: 'Courses', url: 'https://example.com/courses' },
        { name: 'Filters', url: 'https://example.com/courses/filters' },
      ];

      const result = generateBreadcrumbStructuredData(items);
      const parsed = JSON.parse(result);

      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('BreadcrumbList');
      expect(parsed.itemListElement).toHaveLength(3);
      expect(parsed.itemListElement[0].position).toBe(1);
      expect(parsed.itemListElement[0].name).toBe('Home');
    });

    it('should handle items without URLs', () => {
      const items = [{ name: 'Home' }, { name: 'Filters' }];

      const result = generateBreadcrumbStructuredData(items);
      const parsed = JSON.parse(result);

      expect(parsed.itemListElement).toHaveLength(2);
      expect(parsed.itemListElement[0].item).toBeUndefined();
    });
  });

  describe('generateFilterGroupStructuredData', () => {
    it('should generate valid PropertyValueSpecification', () => {
      const group: StructuredDataFilterGroup = {
        id: 'price',
        name: 'Price Range',
        description: 'Filter by price',
        type: 'range',
        options: [
          { id: 'free', label: 'Free', description: '$0' },
          { id: 'paid', label: 'Paid', description: '$1+' },
        ],
      };

      const result = generateFilterGroupStructuredData(group);
      const parsed = JSON.parse(result);

      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('PropertyValueSpecification');
      expect(parsed.name).toBe('Price Range');
      expect(parsed.valueSpecification).toHaveLength(2);
    });

    it('should include valueRequired as false', () => {
      const group: StructuredDataFilterGroup = {
        id: 'topics',
        name: 'Topics',
        type: 'multiselect',
        options: [{ id: 'coding', label: 'Coding' }],
      };

      const result = generateFilterGroupStructuredData(group);
      const parsed = JSON.parse(result);

      expect(parsed.valueSpecification[0].valueRequired).toBe(false);
    });
  });

  describe('validateStructuredData', () => {
    it('should validate correct JSON-LD', () => {
      const validJsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FilterControls',
        name: 'Test',
      });

      const result = validateStructuredData(validJsonLd);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject JSON-LD without @context', () => {
      const invalidJsonLd = JSON.stringify({
        '@type': 'FilterControls',
        name: 'Test',
      });

      const result = validateStructuredData(invalidJsonLd);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing @context field');
    });

    it('should reject JSON-LD without @type', () => {
      const invalidJsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        name: 'Test',
      });

      const result = validateStructuredData(invalidJsonLd);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing @type field');
    });

    it('should reject JSON-LD with non-schema.org context', () => {
      const invalidJsonLd = JSON.stringify({
        '@context': 'https://example.org',
        '@type': 'FilterControls',
        name: 'Test',
      });

      const result = validateStructuredData(invalidJsonLd);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('@context must include schema.org');
    });

    it('should reject invalid JSON', () => {
      const invalidJsonLd = 'not valid json';

      const result = validateStructuredData(invalidJsonLd);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JSON format');
    });

    it('should accept schema.org context with additional context', () => {
      const validJsonLd = JSON.stringify({
        '@context': ['https://schema.org', 'https://example.org'],
        '@type': 'FilterControls',
        name: 'Test',
      });

      const result = validateStructuredData(validJsonLd);

      expect(result.valid).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should generate and validate complete filter structured data', () => {
      const filterGroups: StructuredDataFilterGroup[] = [
        {
          id: 'difficulty',
          name: 'Difficulty Level',
          description: 'Filter by difficulty',
          type: 'checkbox',
          options: [
            { id: 'beginner', label: 'Beginner', description: 'Entry level' },
            { id: 'intermediate', label: 'Intermediate', description: 'Mid level' },
            { id: 'advanced', label: 'Advanced', description: 'Expert level' },
          ],
        },
        {
          id: 'price',
          name: 'Price',
          description: 'Filter by price',
          type: 'range',
          options: [{ id: 'price', label: 'Price', value: '200' }],
        },
      ];

      const jsonLd = generateFilterStructuredData(filterGroups);
      const validation = validateStructuredData(jsonLd);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const parsed = JSON.parse(jsonLd);
      expect(parsed.itemListElement).toHaveLength(2);
    });
  });
});
