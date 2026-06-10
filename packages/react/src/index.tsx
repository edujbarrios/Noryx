"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode
} from "react";
import type { Primitive, PrimitiveInput, PrimitiveOutput } from "@noryx/core";
import { createRuntime, type NoryxRuntime } from "@noryx/runtime";

const RuntimeContext = createContext<NoryxRuntime | null>(null);

export interface NoryxProviderProps {
  readonly runtime?: NoryxRuntime;
  readonly children: ReactNode;
}

export function NoryxProvider({ runtime, children }: NoryxProviderProps) {
  const value = useMemo(() => runtime ?? createRuntime(), [runtime]);
  return createElement(RuntimeContext.Provider, { value }, children);
}

export function useNoryxRuntime(): NoryxRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error("useNoryxRuntime must be used within <NoryxProvider>.");
  }
  return runtime;
}

export interface PrimitiveHookState<TOutput> {
  readonly data?: TOutput;
  readonly error?: Error;
  readonly isRunning: boolean;
}

export function createPrimitiveHook<TPrimitive extends Primitive<unknown, unknown>>(
  primitive: TPrimitive
) {
  return function usePrimitive() {
    const runtime = useNoryxRuntime();
    const [state, setState] = useState<PrimitiveHookState<PrimitiveOutput<TPrimitive>>>({
      isRunning: false
    });

    const run = useCallback(
      async (input: PrimitiveInput<TPrimitive>) => {
        setState({ isRunning: true });
        try {
          const data = await runtime.execute(primitive, input);
          setState({ data, isRunning: false });
          return data;
        } catch (error) {
          const normalized = error instanceof Error ? error : new Error(String(error));
          setState({ error: normalized, isRunning: false });
          throw normalized;
        }
      },
      [runtime]
    );

    return { ...state, run };
  };
}

export interface ReactPrimitiveProps<TInput, TOutput> {
  readonly input: TInput;
  readonly children?: (state: PrimitiveHookState<TOutput>) => ReactNode;
  readonly fallback?: ReactNode;
}

export function createReactPrimitive<TPrimitive extends Primitive<unknown, unknown>>(
  primitive: TPrimitive
) {
  const usePrimitive = createPrimitiveHook(primitive);

  return function ReactPrimitive(
    props: ReactPrimitiveProps<PrimitiveInput<TPrimitive>, PrimitiveOutput<TPrimitive>>
  ) {
    const state = usePrimitive();

    useEffect(() => {
      void state.run(props.input);
    }, [props.input]);

    if (props.children) {
      return createElement(createFragment, null, props.children(state));
    }
    if (state.isRunning) {
      return createElement(createFragment, null, props.fallback ?? null);
    }
    return createElement(createFragment, null, state.data ? JSON.stringify(state.data) : null);
  };
}

export function AIWorkflow({ children }: PropsWithChildren) {
  return createElement(createFragment, null, children);
}

function createFragment({ children }: PropsWithChildren) {
  return createElement("div", { "data-noryx": "primitive" }, children);
}
