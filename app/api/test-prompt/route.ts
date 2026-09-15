import { NextRequest, NextResponse } from "next/server";
import { generateTestPrompt, resolveApiKey, missingKeyError } from "@/lib/llm";
import { AgentConfig } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: AgentConfig = body.config;

    if (!config?.prompt?.trim()) {
      return NextResponse.json({ error: "Missing config.prompt." }, { status: 400 });
    }

    const apiKey = resolveApiKey(config.provider, body.apiKey);
    if (!apiKey) {
      return NextResponse.json({ error: missingKeyError(config.provider) }, { status: 400 });
    }

    const testPrompt = await generateTestPrompt(config, apiKey);
    return NextResponse.json({ testPrompt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed." },
      { status: 500 }
    );
  }
}
