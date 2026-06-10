# Noryx

[![CI](https://github.com/edujbarrios/Noryx/actions/workflows/ci.yml/badge.svg)](https://github.com/edujbarrios/Noryx/actions/workflows/ci.yml)

> Build AI-powered applications with composable cognitive primitives.

Software built by Eduardo J. Barrios.

Noryx is a TypeScript-first framework for building AI applications through reusable, composable, provider-agnostic cognitive primitives.

React made UI composable. Noryx makes cognition composable.

```tsx
<AIWorkflow>
  <AIExtract />
  <AIClassify />
  <AISummarize />
</AIWorkflow>
```

## Workspace

```txt
apps/playground
packages/core
packages/runtime
packages/react
packages/providers/openai-compatible
packages/workflows
packages/memory
packages/tools
packages/primitives/chat
packages/primitives/summarize
packages/primitives/extract
packages/primitives/classify
docs
examples
```

## Quick Start

```bash
git clone https://github.com/edujbarrios/Noryx.git
cd Noryx
corepack enable
pnpm install
pnpm build
pnpm dev
```

Run the playground:

```bash
pnpm --filter @noryx/playground dev
```

If `pnpm` is not available globally, use Corepack:

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm dev
```

Optional provider configuration:

```bash
NEXT_PUBLIC_AI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_AI_API_KEY=...
NEXT_PUBLIC_AI_MODEL=gpt-4.1
```

Any OpenAI-compatible endpoint can be used by changing configuration only.

## Create a Primitive

```ts
import { createPrimitive } from "@noryx/core";
import { z } from "zod";

export const SentimentPrimitive = createPrimitive({
  name: "sentiment",
  input: z.object({
    text: z.string()
  }),
  output: z.object({
    sentiment: z.enum(["positive", "neutral", "negative"])
  }),
  async execute(ctx, input) {
    if (!ctx.provider) {
      throw new Error("Sentiment requires a provider.");
    }

    return ctx.provider.extract({
      schema: z.object({
        sentiment: z.enum(["positive", "neutral", "negative"])
      }),
      messages: [{ role: "user", content: input.text }]
    });
  }
});
```

## Runtime

```ts
import { createRuntime } from "@noryx/runtime";
import { createOpenAICompatibleProvider } from "@noryx/openai-compatible";
import { AISummarizePrimitive } from "@noryx/primitive-summarize";

const runtime = createRuntime({
  provider: createOpenAICompatibleProvider({
    apiKey: process.env.API_KEY,
    baseUrl: process.env.BASE_URL,
    model: "gpt-4.1"
  })
});

runtime.registerPrimitive(AISummarizePrimitive);

const result = await runtime.execute(AISummarizePrimitive, {
  text: "Long text...",
  format: "paragraph"
});
```

## Architecture

See [docs/architecture.md](docs/architecture.md).

## Repository

- GitHub: <https://github.com/edujbarrios/Noryx>
- Issues: <https://github.com/edujbarrios/Noryx/issues>
