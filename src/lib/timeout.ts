export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage?: string
): Promise<T> => {
  // Create a timer that will reject after `ms` milliseconds.
  // The timer is cleared when the original promise settles to avoid
  // lingering timeouts and potential memory leaks.
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage ?? 'Operation timed out'));
    }, ms);
  });

  // Wrap the original promise to clear the timer on either success
  // or failure before propagating the result.
  const wrappedPromise = promise.finally(() => clearTimeout(timer));

  return Promise.race([wrappedPromise, timeoutPromise]) as Promise<T>;
};
