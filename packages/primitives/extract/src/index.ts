import { createPrimitive, type NoryxPlugin } from "@noryx/core";
import { z, type ZodTypeAny } from "zod";

export const extractInputSchema = z.object({
  text: z.string().min(1),
  schema: z.custom<ZodTypeAny>((value) => Boolean(value && typeof value === "object" && "parse" in value)),
  instructions: z.string().optional()
});

export const extractOutputSchema = z.object({
  data: z.unknown()
});

export const AIExtractPrimitive = createPrimitive({
  id: "noryx.primitive.extract",
  name: "AIExtract",
  input: extractInputSchema,
  output: extractOutputSchema,
  async execute(ctx, input) {
    if (!ctx.provider) {
      throw new Error("AIExtract requires a provider.");
    }
    const data = await ctx.provider.extract({
      schema: input.schema,
      messages: [
        {
          role: "system",
          content: input.instructions ?? "Extract structured data from the user text."
        },
        {
          role: "user",
          content: input.text
        }
      ]
    });
    return { data };
  }
});

export const extractPlugin: NoryxPlugin = {
  name: "@noryx/primitive-extract",
  version: "0.1.0",
  setup(registry) {
    registry.register(AIExtractPrimitive);
  }
};
