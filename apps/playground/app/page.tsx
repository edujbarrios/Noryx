"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { createRuntime } from "@noryx/runtime";
import { createOpenAICompatibleProvider } from "@noryx/openai-compatible";
import { NoryxProvider } from "@noryx/react";
import { AIChatPrimitive } from "@noryx/primitive-chat";
import { AIClassifyPrimitive } from "@noryx/primitive-classify";
import { AIExtractPrimitive } from "@noryx/primitive-extract";
import { AISummarizePrimitive } from "@noryx/primitive-summarize";
import { createWorkflow } from "@noryx/workflows";

const InvoiceSchema = z.object({
  invoiceNumber: z.string(),
  vendor: z.string(),
  total: z.number()
});

export default function PlaygroundPage() {
  const [text, setText] = useState(
    "Invoice INV-2048 from Northstar Labs totals 1299.95 USD for design systems consulting."
  );
  const [output, setOutput] = useState("Run a primitive to see output.");

  const runtime = useMemo(() => {
    const nextRuntime = createRuntime({
      provider: createOpenAICompatibleProvider({
        apiKey: process.env.NEXT_PUBLIC_AI_API_KEY,
        baseUrl: process.env.NEXT_PUBLIC_AI_BASE_URL,
        model: process.env.NEXT_PUBLIC_AI_MODEL ?? "gpt-4.1"
      })
    });
    nextRuntime.registerPrimitive(AIChatPrimitive);
    nextRuntime.registerPrimitive(AISummarizePrimitive);
    nextRuntime.registerPrimitive(AIExtractPrimitive);
    nextRuntime.registerPrimitive(AIClassifyPrimitive);
    return nextRuntime;
  }, []);

  async function runSummarize() {
    const result = await runtime.execute(AISummarizePrimitive, {
      text,
      format: "paragraph",
      maxWords: 40
    });
    setOutput(result.summary);
  }

  async function runExtract() {
    const result = await runtime.execute(AIExtractPrimitive, {
      text,
      schema: InvoiceSchema
    });
    setOutput(JSON.stringify(result.data, null, 2));
  }

  async function runClassify() {
    const result = await runtime.execute(AIClassifyPrimitive, {
      text,
      labels: ["invoice", "support", "legal", "marketing"]
    });
    setOutput(JSON.stringify(result, null, 2));
  }

  async function runWorkflow() {
    const workflow = createWorkflow<string, { summary: string }>("invoice-intake")
      .addNode({
        id: "summarize",
        primitive: AISummarizePrimitive,
        mapInput: (current: unknown) => ({ text: String(current), format: "paragraph" as const, maxWords: 30 })
      })
      .addNode({
        id: "classify",
        primitive: AIClassifyPrimitive,
        mapInput: (current: unknown) => ({
          text: JSON.stringify(current),
          labels: ["invoice", "support", "legal", "marketing"]
        })
      });

    const result = await workflow.execute(runtime, text);
    setOutput(JSON.stringify(result, null, 2));
  }

  return (
    <NoryxProvider runtime={runtime}>
      <main className="min-h-screen bg-paper text-ink">
        <section className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-clay">
                Software built by Eduardo J. Barrios
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight">
                Noryx
              </h1>
              <p className="mt-4 max-w-xl text-lg text-ink/70">
                Build AI-powered applications with composable cognitive primitives.
              </p>
            </div>
            <div className="rounded border border-line bg-white/50 p-4">
              <div className="text-sm font-medium text-ink/70">Provider</div>
              <div className="mt-2 text-sm">
                Configure <code>NEXT_PUBLIC_AI_BASE_URL</code>, <code>NEXT_PUBLIC_AI_API_KEY</code>,
                and <code>NEXT_PUBLIC_AI_MODEL</code>.
              </div>
            </div>
          </div>

          <div className="grid content-center gap-4">
            <textarea
              className="min-h-44 resize-y rounded border border-line bg-white p-4 outline-none focus:border-clay"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button className="rounded bg-ink px-4 py-3 text-sm font-medium text-white" onClick={runSummarize}>
                Summarize
              </button>
              <button className="rounded bg-moss px-4 py-3 text-sm font-medium text-white" onClick={runExtract}>
                Extract
              </button>
              <button className="rounded bg-clay px-4 py-3 text-sm font-medium text-white" onClick={runClassify}>
                Classify
              </button>
              <button className="rounded border border-ink px-4 py-3 text-sm font-medium" onClick={runWorkflow}>
                Workflow
              </button>
            </div>
            <pre className="min-h-64 overflow-auto rounded border border-line bg-white p-4 text-sm">
              {output}
            </pre>
          </div>
        </section>
      </main>
    </NoryxProvider>
  );
}
