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

export function validateCronExpression(expression: string): boolean {
  try {
    const cron = parseCronExpression(expression);

    // Basic validation
    const validateField = (value: string, min: number, max: number): boolean => {
      if (value === '*') return true;
      if (value.includes('/')) {
        const [range, step] = value.split('/');
        if (range !== '*' && !validateField(range, min, max)) return false;
        const stepNum = parseInt(step, 10);
        return !isNaN(stepNum) && stepNum > 0;
      }
      if (value.includes('-')) {
        const [start, end] = value.split('-').map((v) => parseInt(v, 10));
        return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end;
      }
      if (value.includes(',')) {
        return value.split(',').every((v) => validateField(v.trim(), min, max));
      }
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= min && num <= max;
    };

    return (
      validateField(cron.minute, 0, 59) &&
      validateField(cron.hour, 0, 23) &&
      validateField(cron.dayOfMonth, 1, 31) &&
      validateField(cron.month, 1, 12) &&
      validateField(cron.dayOfWeek, 0, 6)
    );
  } catch {
    return false;
  }
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
