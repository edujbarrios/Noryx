import type {
  AIProvider,
  ProviderChatRequest,
  ProviderChatResponse,
  ProviderExtractRequest,
  ProviderStreamChunk
} from "@noryx/core";

export interface OpenAICompatibleProviderOptions {
  readonly apiKey?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly model: string;
  readonly headers?: Record<string, string> | undefined;
  readonly fetch?: typeof fetch | undefined;
}

interface ChatCompletionResponse {
  readonly choices?: Array<{
    readonly message?: {
      readonly content?: string | null;
    };
  }>;
}

export function createOpenAICompatibleProvider(
  options: OpenAICompatibleProviderOptions
): AIProvider {
  const baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const fetcher = options.fetch ?? fetch;

  async function chat(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const response = await fetcher(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: createHeaders(options),
      body: JSON.stringify({
        model: request.model ?? options.model,
        messages: request.messages,
        temperature: request.temperature,
        tools: request.tools
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible provider failed: ${response.status} ${await response.text()}`);
    }

    const json = (await response.json()) as ChatCompletionResponse;
    return {
      content: json.choices?.[0]?.message?.content ?? "",
      raw: json
    };
  }

  return {
    id: "openai-compatible",
    chat,
    async complete(prompt, request = {}) {
      const response = await chat({
        ...request,
        messages: [{ role: "user", content: prompt }]
      });
      return response.content;
    },
    async *stream(request): AsyncIterable<ProviderStreamChunk> {
      const response = await fetcher(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: createHeaders(options),
        body: JSON.stringify({
          model: request.model ?? options.model,
          messages: request.messages,
          temperature: request.temperature,
          stream: true
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`OpenAI-compatible stream failed: ${response.status} ${await response.text()}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:") || trimmed === "data: [DONE]") {
            continue;
          }
          const payload = JSON.parse(trimmed.slice(5).trim()) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = payload.choices?.[0]?.delta?.content;
          if (content) {
            yield { content, raw: payload };
          }
        }
      }
    },
    async extract<TOutput>(request: ProviderExtractRequest<TOutput>): Promise<TOutput> {
      const response = await chat({
        ...request,
        messages: [
          ...request.messages,
          {
            role: "system",
            content: "Return only JSON that conforms to the requested schema."
          }
        ]
      });
      return request.schema.parse(JSON.parse(response.content));
    }
  };
}

function createHeaders(options: OpenAICompatibleProviderOptions): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
    ...options.headers
  };
}
