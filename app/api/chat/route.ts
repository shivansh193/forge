import { NextRequest, NextResponse } from "next/server";
import { runAgent, resolveApiKey, missingKeyError } from "@/lib/llm";
import { AgentConfig } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: AgentConfig = body.config;
    const message: string = body.message;

    if (!config?.prompt?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Missing config.prompt or message." }, { status: 400 });
    }

    const apiKey = resolveApiKey(config.provider, body.apiKey);
    if (!apiKey) {
      return NextResponse.json({ error: missingKeyError(config.provider) }, { status: 400 });
    }

    const response = await runAgent(config, message, apiKey);
    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed." },
      { status: 500 }
    );
  }
}
