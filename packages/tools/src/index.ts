import type { Tool } from "@noryx/core";
import type { ZodType } from "zod";

export interface ToolFactoryOptions<TInput, TOutput> {
  readonly name: string;
  readonly description: string;
  readonly schema: ZodType<TInput>;
  execute(input: TInput): Promise<TOutput>;
}

export function createTool<TInput, TOutput>(
  options: ToolFactoryOptions<TInput, TOutput>
): Tool<TInput, TOutput> {
  return {
    name: options.name,
    description: options.description,
    schema: options.schema,
    execute: async (input) => options.execute(options.schema.parse(input))
  };
}

export class ToolRegistry {
  private readonly tools = new Map<string, Tool<unknown, unknown>>();

  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
    this.tools.set(tool.name, tool as Tool<unknown, unknown>);
  }

  get<TInput, TOutput>(name: string): Tool<TInput, TOutput> | undefined {
    return this.tools.get(name) as Tool<TInput, TOutput> | undefined;
  }

  list(): Tool<unknown, unknown>[] {
    return Array.from(this.tools.values());
  }
}
