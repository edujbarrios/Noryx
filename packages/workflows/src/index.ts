import type { JsonObject, Primitive } from "@noryx/core";
import type { NoryxRuntime } from "@noryx/runtime";

export interface WorkflowNode<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly primitive: Primitive<TInput, TOutput>;
  readonly mapInput?: (previous: unknown, initial: unknown) => TInput;
}

export interface WorkflowResult<TOutput> {
  readonly output: TOutput;
  readonly steps: WorkflowStepResult[];
}

export interface WorkflowStepResult {
  readonly nodeId: string;
  readonly primitiveId: string;
  readonly output: unknown;
}

export interface SequentialWorkflowOptions {
  readonly id?: string;
  readonly metadata?: JsonObject;
}

export class SequentialWorkflow<TInput, TOutput = unknown> {
  readonly id: string;
  private readonly nodes: WorkflowNode[] = [];

  constructor(id = "workflow") {
    this.id = id;
  }

  addNode<TNodeInput, TNodeOutput>(node: WorkflowNode<TNodeInput, TNodeOutput>): this {
    this.nodes.push(node as WorkflowNode);
    return this;
  }

  async execute(
    runtime: NoryxRuntime,
    input: TInput,
    options: SequentialWorkflowOptions = {}
  ): Promise<WorkflowResult<TOutput>> {
    let current: unknown = input;
    const steps: WorkflowStepResult[] = [];

    for (const node of this.nodes) {
      const nodeInput = node.mapInput ? node.mapInput(current, input) : current;
      current = await runtime.execute(node.primitive, nodeInput, {
        metadata: {
          ...options.metadata,
          workflowId: options.id ?? this.id,
          nodeId: node.id
        }
      });
      steps.push({
        nodeId: node.id,
        primitiveId: node.primitive.id,
        output: current
      });
    }

    return {
      output: current as TOutput,
      steps
    };
  }
}

export function createWorkflow<TInput, TOutput = unknown>(
  id?: string
): SequentialWorkflow<TInput, TOutput> {
  return new SequentialWorkflow<TInput, TOutput>(id);
}
