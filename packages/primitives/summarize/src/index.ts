import { createPrimitive, type NoryxPlugin } from "@noryx/core";
import { z } from "zod";

export const summarizeInputSchema = z.object({
  text: z.string().min(1),
  format: z.enum(["paragraph", "bullets"]).default("paragraph"),
  maxWords: z.number().int().positive().optional()
});

export const summarizeOutputSchema = z.object({
  summary: z.string()
});

export const AISummarizePrimitive = createPrimitive({
  id: "noryx.primitive.summarize",
  name: "AISummarize",
  input: summarizeInputSchema,
  output: summarizeOutputSchema,
  async execute(ctx, input) {
    if (!ctx.provider) {
      throw new Error("AISummarize requires a provider.");
    }
    const response = await ctx.provider.chat({
      messages: [
        {
          role: "system",
          content: "Summarize the user text clearly and faithfully."
        },
        {
          role: "user",
          content: `Format: ${input.format}. Max words: ${input.maxWords ?? "unbounded"}.\n\n${input.text}`
        }
      ]
    });
    return { summary: response.content };
  }
});

export const summarizePlugin: NoryxPlugin = {
  name: "@noryx/primitive-summarize",
  version: "0.1.0",
  setup(registry) {
    registry.register(AISummarizePrimitive);
  }
};
