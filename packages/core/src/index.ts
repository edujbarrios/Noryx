import { z, type ZodType } from "zod";

export type JsonObject = Record<string, unknown>;

export interface ProviderChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string | undefined;
}

export interface ProviderChatRequest {
  messages: ProviderChatMessage[];
  model?: string | undefined;
  temperature?: number | undefined;
  tools?: ToolDefinition[] | undefined;
  metadata?: JsonObject | undefined;
}

export interface ProviderChatResponse {
  content: string;
  raw?: unknown;
}

export interface ProviderStreamChunk {
  content: string;
  raw?: unknown;
}

export interface ProviderExtractRequest<TOutput> extends ProviderChatRequest {
  schema: ZodType<TOutput>;
}

export interface AIProvider {
  readonly id: string;
  chat(request: ProviderChatRequest): Promise<ProviderChatResponse>;
  complete(prompt: string, options?: Omit<ProviderChatRequest, "messages">): Promise<string>;
  stream(request: ProviderChatRequest): AsyncIterable<ProviderStreamChunk>;
  extract<TOutput>(request: ProviderExtractRequest<TOutput>): Promise<TOutput>;
}

export interface ExecutionContext {
  readonly runtimeId: string;
  readonly provider: AIProvider | undefined;
  readonly signal: AbortSignal | undefined;
  readonly metadata: JsonObject;
  readonly services: ServiceContainer;
}

export interface ServiceContainer {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
}

export interface Primitive<TInput, TOutput> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly inputSchema: ZodType<TInput>;
  readonly outputSchema: ZodType<TOutput>;
  execute(context: ExecutionContext, input: TInput): Promise<TOutput>;
}

export interface PrimitiveDefinition<TInput, TOutput> {
  readonly id?: string;
  readonly name: string;
  readonly version?: string;
  readonly input: ZodType<TInput>;
  readonly output: ZodType<TOutput>;
  execute(context: ExecutionContext, input: TInput): Promise<TOutput>;
}

export type PrimitiveInput<TPrimitive> =
  TPrimitive extends Primitive<infer TInput, unknown> ? TInput : never;

export type PrimitiveOutput<TPrimitive> =
  TPrimitive extends Primitive<unknown, infer TOutput> ? TOutput : never;

export function createPrimitive<TInput, TOutput>(
  definition: PrimitiveDefinition<TInput, TOutput>
): Primitive<TInput, TOutput> {
  const id = definition.id ?? `noryx.${definition.name}`;

  return {
    id,
    name: definition.name,
    version: definition.version ?? "0.1.0",
    inputSchema: definition.input,
    outputSchema: definition.output,
    execute: definition.execute
  };
}

export interface PrimitiveRegistry {
  register<TInput, TOutput>(primitive: Primitive<TInput, TOutput>): void;
  get<TInput, TOutput>(id: string): Primitive<TInput, TOutput> | undefined;
  remove(id: string): boolean;
  list(): Primitive<unknown, unknown>[];
}

export function createPrimitiveRegistry(): PrimitiveRegistry {
  const primitives = new Map<string, Primitive<unknown, unknown>>();

  return {
    register<TInput, TOutput>(primitive: Primitive<TInput, TOutput>) {
      primitives.set(primitive.id, primitive as Primitive<unknown, unknown>);
    },
    get<TInput, TOutput>(id: string) {
      return primitives.get(id) as Primitive<TInput, TOutput> | undefined;
    },
    remove(id: string) {
      return primitives.delete(id);
    },
    list() {
      return Array.from(primitives.values());
    }
  };
}

export interface Tool<TInput, TOutput> {
  readonly name: string;
  readonly description: string;
  readonly schema: ZodType<TInput>;
  execute(input: TInput): Promise<TOutput>;
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: ZodType<unknown>;
}

export interface NoryxPlugin {
  readonly name: string;
  readonly version: string;
  setup(registry: PrimitiveRegistry): void | Promise<void>;
}

export const emptyInputSchema = z.object({}).strict();
