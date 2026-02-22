/**
 * Utility functions for state management and manipulation.
 */

/**
 * Deep merges two objects.
 */
export const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> => {
  if (!source) return target;
  if (!target) return source;

  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const targetVal = target[key];
      const sourceVal = source[key];
      
      if (isObject(sourceVal)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceVal });
        } else {
          output[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal);
        }
      } else {
        Object.assign(output, { [key]: sourceVal });
      }
    });
  }
  return output;
};

/**
 * Checks if a value is a plain object.
 */
export const isObject = (item: unknown): item is Record<string, unknown> => {
  return !!item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Debounces a function.
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

/**
 * Generates a unique temporary ID for optimistic updates.
 */
export const generateTempId = () => `temp_${Math.random().toString(36).substr(2, 9)}`;
