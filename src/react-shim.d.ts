declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useState<T = undefined>(): [T | undefined, (newState: T | undefined | ((prevState: T | undefined) => T | undefined)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T = undefined>(): { current: T | undefined };
  export const React: any;
  export default React;
}
