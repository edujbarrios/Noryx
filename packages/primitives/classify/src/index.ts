import { createPrimitive, type NoryxPlugin } from "@noryx/core";
import { z } from "zod";

export const classifyInputSchema = z.object({
  text: z.string().min(1),
  labels: z.array(z.string().min(1)).min(1),
  instructions: z.string().optional()
});

export const classifyOutputSchema = z.object({
  label: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional()
});

export const AIClassifyPrimitive = createPrimitive({
  id: "noryx.primitive.classify",
  name: "AIClassify",
  input: classifyInputSchema,
  output: classifyOutputSchema,
  async execute(ctx, input) {
    if (!ctx.provider) {
      throw new Error("AIClassify requires a provider.");
    }
    return ctx.provider.extract({
      schema: classifyOutputSchema,
      messages: [
        {
          role: "system",
          content:
            input.instructions ??
            "Classify the user text into exactly one provided label. Return JSON only."
        },
        {
          role: "user",
          content: `Labels: ${input.labels.join(", ")}\n\nText:\n${input.text}`
        }
      ]
    });
  }
});

export const classifyPlugin: NoryxPlugin = {
  name: "@noryx/primitive-classify",
  version: "0.1.0",
  setup(registry) {
    registry.register(AIClassifyPrimitive);
  }
};
