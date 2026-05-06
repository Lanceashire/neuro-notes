declare module '*.css';

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module 'react' {
  export type SetStateAction<S> = S | ((previousState: S) => S);
  export type Dispatch<A> = (value: A) => void;

  export interface MutableRefObject<T> {
    current: T;
  }

  export interface PointerEvent<T = Element> {
    target: EventTarget;
    currentTarget: T;
    clientX: number;
    clientY: number;
    preventDefault(): void;
  }

  export interface WheelEvent<T = Element> {
    target: EventTarget;
    currentTarget: T;
    deltaY: number;
    preventDefault(): void;
  }

  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  export function useRef<T>(initialValue: T): MutableRefObject<T>;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

  export const StrictMode: (props: { children?: unknown }) => JSX.Element;

  const React: {
    StrictMode: typeof StrictMode;
  };

  export default React;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'react-dom/client' {
  export function createRoot(element: HTMLElement): {
    render(children: unknown): void;
  };

  const ReactDOM: {
    createRoot: typeof createRoot;
  };

  export default ReactDOM;
}
