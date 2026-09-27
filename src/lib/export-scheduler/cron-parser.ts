/**
 * Simple Cron Expression Parser
 * Supports basic cron expressions for scheduling
 */

export interface CronExpression {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

/** The five cron fields, in order, with their permitted numeric ranges. */
export const CRON_FIELDS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'dayOfMonth', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  // 7 is accepted as a second spelling of Sunday, as crontab does.
  { name: 'dayOfWeek', min: 0, max: 7 },
] as const;

export type CronFieldName = (typeof CRON_FIELDS)[number]['name'];

/** One reason an expression was rejected, addressed to whoever typed it. */
export interface CronValidationError {
  field: CronFieldName | 'expression';
  value: string;
  message: string;
}

export interface CronValidationResult {
  valid: boolean;
  errors: CronValidationError[];
  /** The parsed fields, present only when `valid` is true. */
  expression?: CronExpression;
}

/** Thrown by [`assertValidCron`]; carries every reason, not just the first. */
export class InvalidCronExpressionError extends Error {
  readonly errors: CronValidationError[];

  constructor(expression: string, errors: CronValidationError[]) {
    super(
      `Invalid cron expression "${expression}": ${errors
        .map((error) => `${error.field} ${error.message}`)
        .join('; ')}`,
    );
    this.name = 'InvalidCronExpressionError';
    this.errors = errors;
  }
}

export function parseCronExpression(expression: string): CronExpression {
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    throw new Error('Invalid cron expression. Expected format: minute hour day month weekday');
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

/**
 * Strict integer parse.
 *
 * `parseInt` stops at the first non-digit, so it reads "5x" as 5 and would
 * wave through `0 0 5x * *` — an expression cron itself rejects. Anything but
 * digits is a typo worth reporting.
 */
function toInteger(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;
}

/** Validates one field value, returning the reason it failed, or null. */
function fieldError(value: string, min: number, max: number): string | null {
  const trimmed = value.trim();

  if (trimmed === '') return 'is empty';
  if (trimmed === '*') return null;

  if (trimmed.includes(',')) {
    for (const part of trimmed.split(',')) {
      const error = fieldError(part, min, max);
      if (error) return `list entry "${part.trim()}" ${error}`;
    }
    return null;
  }

  if (trimmed.includes('/')) {
    const segments = trimmed.split('/');
    if (segments.length !== 2) return `has a malformed step in "${trimmed}"`;

    const [range, step] = segments;
    if (range !== '*') {
      const rangeError = fieldError(range, min, max);
      if (rangeError) return `step base "${range}" ${rangeError}`;
    }

    const stepValue = toInteger(step);
    if (stepValue === null) return `step "${step}" is not a number`;
    if (stepValue <= 0) return `step "${step}" must be greater than zero`;
    if (stepValue > max) return `step "${step}" exceeds the maximum of ${max}`;
    return null;
  }

  if (trimmed.includes('-')) {
    const segments = trimmed.split('-');
    if (segments.length !== 2) return `has a malformed range in "${trimmed}"`;

    const start = toInteger(segments[0]);
    const end = toInteger(segments[1]);
    if (start === null || end === null) return `range "${trimmed}" is not numeric`;
    if (start < min || end > max) return `range "${trimmed}" is outside ${min}-${max}`;
    if (start > end) return `range "${trimmed}" starts after it ends`;
    return null;
  }

  const numeric = toInteger(trimmed);
  if (numeric === null) return `value "${trimmed}" is not a number`;
  if (numeric < min || numeric > max) return `value "${trimmed}" is outside ${min}-${max}`;
  return null;
}

/**
 * Validates a cron expression, reporting every problem it finds.
 *
 * A boolean is not enough for a form: the user who typed `0 0 * * 9` needs to
 * be told which field is wrong and why, not simply that something is. Every
 * field is checked rather than stopping at the first failure, so one save
 * surfaces every mistake.
 */
export function validateCron(expression: string): CronValidationResult {
  if (typeof expression !== 'string' || expression.trim() === '') {
    return {
      valid: false,
      errors: [{ field: 'expression', value: String(expression ?? ''), message: 'is empty' }],
    };
  }

  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      valid: false,
      errors: [
        {
          field: 'expression',
          value: expression,
          message: `must have 5 fields (minute hour day month weekday), found ${parts.length}`,
        },
      ],
    };
  }

  const errors: CronValidationError[] = [];
  CRON_FIELDS.forEach((field, index) => {
    const message = fieldError(parts[index], field.min, field.max);
    if (message) errors.push({ field: field.name, value: parts[index], message });
  });

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, errors: [], expression: parseCronExpression(expression) };
}

/** Boolean form of [`validateCron`], kept for existing callers. */
export function validateCronExpression(expression: string): boolean {
  return validateCron(expression).valid;
}

/** Throws [`InvalidCronExpressionError`] when `expression` is not valid. */
export function assertValidCron(expression: string): CronExpression {
  const result = validateCron(expression);
  if (!result.valid || !result.expression) {
    throw new InvalidCronExpressionError(expression, result.errors);
  }
  return result.expression;
}

/** One-line summary of why an expression was rejected, for logs and toasts. */
export function describeCronErrors(errors: CronValidationError[]): string {
  return errors.map((error) => `${error.field}: ${error.message}`).join('; ');
}

export function getNextRunTime(cronExpression: string, fromDate: Date = new Date()): Date {
  const cron = parseCronExpression(cronExpression);
  const next = new Date(fromDate);

  // Simple implementation - advance to next matching time
  // In production, use a library like 'cron-parser' or 'node-cron'
  next.setMinutes(next.getMinutes() + 1);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // For now, return next hour as a simple approximation
  // Real implementation would properly parse and calculate
  if (cron.minute !== '*') {
    const targetMinute = parseInt(cron.minute, 10);
    if (!isNaN(targetMinute)) {
      next.setMinutes(targetMinute);
      if (next <= fromDate) {
        next.setHours(next.getHours() + 1);
      }
    }
  }

  return next;
}

export function frequencyToCron(frequency: string): string {
  switch (frequency) {
    case 'daily':
      return '0 0 * * *'; // Every day at midnight
    case 'weekly':
      return '0 0 * * 0'; // Every Sunday at midnight
    case 'monthly':
      return '0 0 1 * *'; // First day of month at midnight
    default:
      return '0 * * * *'; // Every hour
  }
}
