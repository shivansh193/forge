import { NextRequest, NextResponse } from "next/server";
import { generateTestPrompt, runAgent } from "@/lib/gemini";
import { AgentConfig } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: AgentConfig = body.config;
    const apiKey: string = body.apiKey?.trim() || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key configured. Add GEMINI_API_KEY on the server or paste your own key." },
        { status: 400 }
      );
    }
    if (!config?.prompt?.trim()) {
      return NextResponse.json({ error: "Missing config.prompt." }, { status: 400 });
    }

    const testPrompt = await generateTestPrompt(config, apiKey);
    const response = await runAgent(config, testPrompt, apiKey);
    return NextResponse.json({ testPrompt, response });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed." },
      { status: 500 }
    );
  }
}
