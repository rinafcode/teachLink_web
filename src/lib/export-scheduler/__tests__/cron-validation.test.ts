import { describe, it, expect } from 'vitest';
import {
  InvalidCronExpressionError,
  assertValidCron,
  describeCronErrors,
  frequencyToCron,
  validateCron,
  validateCronExpression,
} from '../cron-parser';

describe('validateCron', () => {
  it.each([
    ['* * * * *', 'every minute'],
    ['0 0 * * *', 'daily at midnight'],
    ['30 9 * * 1-5', 'weekdays at 09:30'],
    ['*/15 * * * *', 'every fifteen minutes'],
    ['0 0 1 * *', 'first of the month'],
    ['0 0,12 * * *', 'twice daily'],
    ['0 9-17/2 * * *', 'every other hour in business hours'],
    ['59 23 31 12 6', 'field maximums'],
  ])('accepts %s (%s)', (expression) => {
    expect(validateCron(expression).valid).toBe(true);
  });

  // crontab accepts 7 as a second spelling of Sunday.
  it('accepts 7 as Sunday', () => {
    expect(validateCron('0 0 * * 7').valid).toBe(true);
  });

  it('returns the parsed fields when valid', () => {
    const result = validateCron('30 9 1 6 5');

    expect(result.expression).toEqual({
      minute: '30',
      hour: '9',
      dayOfMonth: '1',
      month: '6',
      dayOfWeek: '5',
    });
  });

  it('tolerates surrounding whitespace and repeated spaces', () => {
    expect(validateCron('  0   0  *  *  *  ').valid).toBe(true);
  });

  describe('rejections', () => {
    it('rejects an empty expression', () => {
      const result = validateCron('');

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('expression');
    });

    it('rejects the wrong number of fields', () => {
      const result = validateCron('0 0 * *');

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('must have 5 fields');
    });

    it('names the field that is out of range', () => {
      const result = validateCron('0 0 * * 9');

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('dayOfWeek');
      expect(result.errors[0].message).toContain('outside 0-7');
    });

    it('rejects a minute above 59', () => {
      expect(validateCron('60 0 * * *').errors[0].field).toBe('minute');
    });

    it('rejects day-of-month zero', () => {
      expect(validateCron('0 0 0 * *').errors[0].field).toBe('dayOfMonth');
    });

    // parseInt stops at the first non-digit, so the old validator read "5x"
    // as 5 and accepted an expression cron itself rejects.
    it('rejects a value with trailing characters', () => {
      const result = validateCron('0 0 5x * *');

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('dayOfMonth');
      expect(result.errors[0].message).toContain('not a number');
    });

    it('rejects a non-numeric value', () => {
      expect(validateCron('abc 0 * * *').valid).toBe(false);
    });

    it('rejects a zero step', () => {
      const result = validateCron('*/0 * * * *');

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('greater than zero');
    });

    it('rejects a non-numeric step', () => {
      expect(validateCron('*/x * * * *').valid).toBe(false);
    });

    it('rejects a backwards range', () => {
      const result = validateCron('0 17-9 * * *');

      expect(result.errors[0].message).toContain('starts after it ends');
    });

    it('rejects a range outside the field bounds', () => {
      expect(validateCron('0 0 * 1-13 *').valid).toBe(false);
    });

    it('rejects a malformed list entry', () => {
      const result = validateCron('0 0,99 * * *');

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('list entry');
    });

    it('rejects an empty list entry', () => {
      expect(validateCron('0 0,, * * *').valid).toBe(false);
    });

    // One save should surface every mistake, not just the first.
    it('reports every bad field at once', () => {
      const result = validateCron('99 99 * * 9');

      expect(result.errors.map((error) => error.field)).toEqual([
        'minute',
        'hour',
        'dayOfWeek',
      ]);
    });
  });
});

describe('validateCronExpression', () => {
  it('keeps the boolean contract for existing callers', () => {
    expect(validateCronExpression('0 0 * * *')).toBe(true);
    expect(validateCronExpression('0 0 * * 9')).toBe(false);
  });
});

describe('assertValidCron', () => {
  it('returns the parsed expression when valid', () => {
    expect(assertValidCron('0 0 * * *').minute).toBe('0');
  });

  it('throws with every reason attached', () => {
    try {
      assertValidCron('99 0 * * 9');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCronExpressionError);
      expect((error as InvalidCronExpressionError).errors).toHaveLength(2);
      expect((error as InvalidCronExpressionError).message).toContain('minute');
    }
  });
});

describe('describeCronErrors', () => {
  it('renders the errors on one line', () => {
    const { errors } = validateCron('99 0 * * *');

    expect(describeCronErrors(errors)).toBe('minute: value "99" is outside 0-59');
  });
});

describe('frequencyToCron', () => {
  it.each(['daily', 'weekly', 'monthly', 'hourly', 'anything-else'])(
    'produces a valid expression for %s',
    (frequency) => {
      expect(validateCron(frequencyToCron(frequency)).valid).toBe(true);
    },
  );
});
