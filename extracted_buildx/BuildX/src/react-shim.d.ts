// Fallback TypeScript ambient definitions for React & JSX in case node_modules is not yet installed
declare module 'react' {
  export = React;
  export as namespace React;
}

declare namespace React {
  export type FC<P = {}> = (props: P) => any;
  export type ReactNode = any;
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export interface CSSProperties {
    [key: string]: any;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

