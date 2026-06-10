# Noryx Architecture

Noryx is a TypeScript-first cognitive application framework. Its core idea is that AI behavior should be composed through reusable primitives in the same spirit that UI is composed through React components.

## Architectural Decisions

Noryx separates concerns into layers:

```txt
Applications
  -> React Bindings
  -> Workflow Engine
  -> Primitive Runtime
  -> Provider Layer
  -> LLM APIs
```

The core package defines contracts only. It has no React dependency, no provider dependency, and no knowledge of built-in primitives. Runtime execution, React bindings, providers, workflows, memory, tools, and primitives all live in separate packages.

## Package Responsibilities

- `@noryx/core`: primitive, provider, tool, plugin, registry, and execution context contracts.
- `@noryx/runtime`: dynamic registration, validation, middleware, lifecycle events, dependency injection, and execution.
- `@noryx/react`: `NoryxProvider`, `useNoryxRuntime`, `createPrimitiveHook`, `createReactPrimitive`, and `AIWorkflow`.
- `@noryx/openai-compatible`: HTTP adapter for OpenAI-compatible chat, completion, streaming, and extraction APIs.
- `@noryx/workflows`: sequential workflow engine with node mapping and execution traces.
- `@noryx/memory`: memory store contract and `InMemoryStore`.
- `@noryx/tools`: tool factory and registry.
- `@noryx/primitive-*`: built-in primitives implemented as normal plugins.
- `apps/playground`: local Next.js playground that consumes workspace packages.

## Runtime Lifecycle

1. Create a runtime with `createRuntime()`.
2. Optionally attach a provider.
3. Register primitives directly or install plugins.
4. Add middleware with `runtime.use()`.
5. Execute primitives by object reference or registry id.
6. Runtime validates input with Zod.
7. Middleware intercepts execution.
8. Primitive executes against an `ExecutionContext`.
9. Runtime validates output with Zod.
10. Lifecycle events are emitted for registration and execution.

## Primitive Lifecycle

A primitive is created with `createPrimitive()`, receives typed input and output schemas, and is registered dynamically. Built-in primitives use the same `NoryxPlugin` setup path as external packages, which keeps the extension model honest.

## Workflow Model

The MVP workflow engine supports sequential execution. Each node wraps a primitive and can map the previous output plus the initial input into the next primitive input. The model is intentionally node-based so later branching, routing, retries, loops, parallelism, and agentic orchestration can be added without changing the primitive contract.

## Plugin Strategy

Plugins expose a `setup(registry)` function. This keeps package installation and runtime registration separate: adding `@noryx/sentiment` later should only require installing the package and registering its plugin.

## Extension Strategy

Extension points are intentionally small:

- New primitives through `createPrimitive()`.
- New providers through `AIProvider`.
- New middleware through `RuntimeMiddleware`.
- New tools through `createTool()`.
- New memory backends through `MemoryStore`.
- New workflow planners by building on primitive nodes.

## Tradeoffs

The MVP favors explicit package boundaries over feature depth. The workflow engine is sequential, React bindings are factory-based, and provider extraction assumes JSON returned by the model. These are acceptable early constraints because they preserve the long-term architecture while leaving space for stronger orchestration, streaming UX, structured outputs, retries, caching, and observability.

## Scalability Concerns

Future versions should add package-level conformance tests for plugins, typed workflow graph compilation, provider capability negotiation, streaming-aware primitive outputs, structured telemetry, distributed memory stores, permission middleware, cache middleware, and versioned marketplace metadata.
