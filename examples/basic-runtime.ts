import { createRuntime } from "@noryx/runtime";
import { createOpenAICompatibleProvider } from "@noryx/openai-compatible";
import { AISummarizePrimitive } from "@noryx/primitive-summarize";

const runtime = createRuntime({
  provider: createOpenAICompatibleProvider({
    apiKey: process.env.API_KEY,
    baseUrl: process.env.BASE_URL,
    model: process.env.MODEL ?? "gpt-4.1"
  })
});

runtime.registerPrimitive(AISummarizePrimitive);

const result = await runtime.execute(AISummarizePrimitive, {
  text: "Noryx makes cognition composable through reusable TypeScript primitives.",
  format: "paragraph",
  maxWords: 20
});

console.log(result.summary);
