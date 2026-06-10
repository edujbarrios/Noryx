import { createPrimitive, type NoryxPlugin, type ProviderChatMessage } from "@noryx/core";
import { z } from "zod";

export const chatInputSchema = z.object({
  systemPrompt: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string(),
      name: z.string().optional()
    })
  ),
  temperature: z.number().min(0).max(2).optional()
});

export const chatOutputSchema = z.object({
  content: z.string()
});

export const AIChatPrimitive = createPrimitive({
  id: "noryx.primitive.chat",
  name: "AIChat",
  input: chatInputSchema,
  output: chatOutputSchema,
  async execute(ctx, input) {
    if (!ctx.provider) {
      throw new Error("AIChat requires a provider.");
    }
    const messages: ProviderChatMessage[] = input.systemPrompt
      ? [{ role: "system", content: input.systemPrompt }, ...input.messages]
      : input.messages;
    const response = await ctx.provider.chat({
      messages,
      temperature: input.temperature
    });
    return { content: response.content };
  }
});

export const chatPlugin: NoryxPlugin = {
  name: "@noryx/primitive-chat",
  version: "0.1.0",
  setup(registry) {
    registry.register(AIChatPrimitive);
  }
};
