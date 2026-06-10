import {
  createPrimitiveRegistry,
  type AIProvider,
  type ExecutionContext,
  type JsonObject,
  type NoryxPlugin,
  type Primitive,
  type PrimitiveInput,
  type PrimitiveOutput,
  type PrimitiveRegistry,
  type ServiceContainer
} from "@noryx/core";

export interface RuntimeEvent {
  readonly type:
    | "primitive:registered"
    | "primitive:removed"
    | "execution:start"
    | "execution:success"
    | "execution:error";
  readonly primitiveId?: string;
  readonly timestamp: number;
  readonly metadata?: JsonObject;
  readonly error?: unknown;
}

export interface ExecutionRequest<TInput> {
  readonly primitiveId: string;
  readonly input: TInput;
  readonly metadata?: JsonObject;
  readonly signal?: AbortSignal;
}

export interface MiddlewareContext<TInput, TOutput> {
  readonly primitive: Primitive<TInput, TOutput>;
  readonly execution: ExecutionContext;
  readonly input: TInput;
}

export type MiddlewareNext<TOutput> = () => Promise<TOutput>;

export type RuntimeMiddleware = <TInput, TOutput>(
  context: MiddlewareContext<TInput, TOutput>,
  next: MiddlewareNext<TOutput>
) => Promise<TOutput>;

export interface NoryxRuntimeOptions {
  readonly id?: string;
  readonly provider?: AIProvider;
  readonly metadata?: JsonObject;
  readonly services?: ServiceContainer;
}

export class MapServiceContainer implements ServiceContainer {
  private readonly values = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.values.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.values.set(key, value);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }
}

export class NoryxRuntime {
  readonly id: string;
  readonly registry: PrimitiveRegistry;
  private provider: AIProvider | undefined;
  private readonly metadata: JsonObject;
  private readonly services: ServiceContainer;
  private readonly middleware: RuntimeMiddleware[] = [];
  private readonly listeners = new Set<(event: RuntimeEvent) => void>();

  constructor(options: NoryxRuntimeOptions = {}) {
    this.id = options.id ?? `runtime_${cryptoRandomId()}`;
    this.registry = createPrimitiveRegistry();
    this.provider = options.provider;
    this.metadata = options.metadata ?? {};
    this.services = options.services ?? new MapServiceContainer();
  }

  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  use(middleware: RuntimeMiddleware): void {
    this.middleware.push(middleware);
  }

  on(listener: (event: RuntimeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async install(plugin: NoryxPlugin): Promise<void> {
    await plugin.setup(this.registry);
  }

  registerPrimitive<TInput, TOutput>(primitive: Primitive<TInput, TOutput>): void {
    this.registry.register(primitive);
    this.emit({ type: "primitive:registered", primitiveId: primitive.id });
  }

  getPrimitive<TInput, TOutput>(id: string): Primitive<TInput, TOutput> | undefined {
    return this.registry.get(id);
  }

  removePrimitive(id: string): boolean {
    const removed = this.registry.remove(id);
    if (removed) {
      this.emit({ type: "primitive:removed", primitiveId: id });
    }
    return removed;
  }

  async execute<TPrimitive extends Primitive<unknown, unknown>>(
    primitive: TPrimitive,
    input: PrimitiveInput<TPrimitive>,
    options: Omit<ExecutionRequest<PrimitiveInput<TPrimitive>>, "primitiveId" | "input"> = {}
  ): Promise<PrimitiveOutput<TPrimitive>> {
    return this.executePrimitive(primitive, input, options) as Promise<PrimitiveOutput<TPrimitive>>;
  }

  async executeById<TInput, TOutput>(
    request: ExecutionRequest<TInput>
  ): Promise<TOutput> {
    const primitive = this.registry.get<TInput, TOutput>(request.primitiveId);
    if (!primitive) {
      throw new Error(`Primitive "${request.primitiveId}" is not registered.`);
    }
    return this.executePrimitive(primitive, request.input, request);
  }

  private async executePrimitive<TInput, TOutput>(
    primitive: Primitive<TInput, TOutput>,
    input: TInput,
    options: { readonly metadata?: JsonObject; readonly signal?: AbortSignal } = {}
  ): Promise<TOutput> {
    const parsedInput = primitive.inputSchema.parse(input);
    const context: ExecutionContext = {
      runtimeId: this.id,
      provider: this.provider,
      signal: options.signal,
      metadata: { ...this.metadata, ...options.metadata },
      services: this.services
    };

    this.emit({
      type: "execution:start",
      primitiveId: primitive.id,
      metadata: context.metadata
    });

    const dispatch = this.compose(primitive, context, parsedInput);

    try {
      const output = await dispatch();
      const parsedOutput = primitive.outputSchema.parse(output);
      this.emit({ type: "execution:success", primitiveId: primitive.id });
      return parsedOutput;
    } catch (error) {
      this.emit({ type: "execution:error", primitiveId: primitive.id, error });
      throw error;
    }
  }

  private compose<TInput, TOutput>(
    primitive: Primitive<TInput, TOutput>,
    execution: ExecutionContext,
    input: TInput
  ): MiddlewareNext<TOutput> {
    let index = -1;

    const runner = async (position: number): Promise<TOutput> => {
      if (position <= index) {
        throw new Error("Runtime middleware called next() more than once.");
      }
      index = position;

      const middleware = this.middleware[position];
      if (!middleware) {
        return primitive.execute(execution, input);
      }

      return middleware({ primitive, execution, input }, () => runner(position + 1));
    };

    return () => runner(0);
  }

  private emit(event: Omit<RuntimeEvent, "timestamp">): void {
    const fullEvent: RuntimeEvent = { ...event, timestamp: Date.now() };
    for (const listener of this.listeners) {
      listener(fullEvent);
    }
  }
}

export function createRuntime(options?: NoryxRuntimeOptions): NoryxRuntime {
  return new NoryxRuntime(options);
}

function cryptoRandomId(): string {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto && "randomUUID" in globalCrypto) {
    return globalCrypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
