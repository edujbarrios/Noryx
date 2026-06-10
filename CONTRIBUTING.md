# Contributing

Thanks for helping build Noryx.

## Local Setup

```bash
git clone https://github.com/edujbarrios/Noryx.git
cd Noryx
corepack enable
pnpm install
pnpm typecheck
pnpm build
```

## Development Guidelines

- Keep core contracts provider-agnostic and React-free.
- Implement built-in behavior as plugins.
- Use Zod schemas for primitive inputs and outputs.
- Avoid `any`; prefer inferred TypeScript types.
- Keep package boundaries explicit.
- Add runtime middleware for cross-cutting behavior instead of hardcoding shortcuts.

## Package Scripts

```bash
pnpm build
pnpm typecheck
pnpm --filter @noryx/playground dev
```

## Provider Testing

The OpenAI-compatible provider can target OpenAI, OpenRouter, DeepSeek, Groq, Together, Fireworks, Azure OpenAI, LM Studio, LocalAI, or Ollama OpenAI mode by changing `baseUrl`, `apiKey`, and `model`.
