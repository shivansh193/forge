import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/gemini";
import { AgentConfig } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: AgentConfig = body.config;
    const message: string = body.message;
    const apiKey: string = body.apiKey?.trim() || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key configured. Add GEMINI_API_KEY on the server or paste your own key." },
        { status: 400 }
      );
    }
    if (!config?.prompt?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Missing config.prompt or message." }, { status: 400 });
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
