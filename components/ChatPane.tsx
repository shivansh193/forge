"use client";

import { useState } from "react";
import { ChatMessage } from "@/lib/types";
import Markdown from "./Markdown";

export default function ChatPane({
  history,
  onSend,
  disabled,
}: {
  history: ChatMessage[];
  onSend: (message: string) => Promise<void>;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await onSend(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-line rounded-[14px] bg-surface flex flex-col h-[560px]">
      <div className="panel-label px-4 pt-3.5 pb-3 border-b border-line-soft">Chat</div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {history.length === 0 && (
          <div className="text-[13px] text-ink-subtle italic">
            No messages yet — try the agent below.
          </div>
        )}
        {history.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block max-w-[85%] text-left text-[13px] leading-relaxed rounded-[10px] px-3.5 py-2.5 " +
                (m.role === "user"
                  ? "bg-accent-soft text-ink"
                  : "bg-surface-soft border border-line-soft text-ink-muted")
              }
            >
              {m.role === "assistant" ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}
        {sending && <div className="text-[12px] text-ink-subtle italic">Thinking…</div>}
      </div>

      <div className="flex gap-2 p-3 border-t border-line-soft">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          placeholder={disabled ? "Add a prompt first…" : "Message this agent…"}
          className="flex-1 text-[13px] px-3 h-9 border border-line rounded-[6px] bg-surface text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={disabled || sending || !input.trim()}
          className="cursor-pointer text-[13px] font-medium h-9 px-4 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
