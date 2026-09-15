import { NextRequest, NextResponse } from "next/server";
import { judgeBehavior } from "@/lib/judge";
import { resolveApiKey, missingKeyError } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: string = body.input;
    const outputA: string = body.outputA;
    const outputB: string = body.outputB;

    if (!input?.trim() || typeof outputA !== "string" || typeof outputB !== "string") {
      return NextResponse.json({ error: "Missing input, outputA, or outputB." }, { status: 400 });
    }

    // The judge is always Gemini, independent of the agent's own provider --
    // see lib/judgeClient.ts's geminiKeyFor for why body.apiKey is only ever
    // a Gemini key here, never a raw OpenAI/Anthropic BYOK key.
    const apiKey = resolveApiKey("gemini", body.apiKey);
    if (!apiKey) {
      return NextResponse.json({ error: missingKeyError("gemini") }, { status: 400 });
    }

    const verdict = await judgeBehavior(input, outputA, outputB, apiKey);
    return NextResponse.json(verdict);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed." },
      { status: 500 }
    );
  }
}
