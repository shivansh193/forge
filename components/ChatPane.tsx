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
    <div className="border border-line rounded-[16px] bg-surface flex flex-col h-[680px]">
      <div className="panel-label px-5 pt-5 pb-4 border-b border-line-soft text-[14px]">Chat</div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {history.length === 0 && (
          <div className="text-[14px] text-ink-subtle italic">
            No messages yet — try the agent below.
          </div>
        )}
        {history.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block max-w-[85%] text-left text-[14px] leading-relaxed rounded-[12px] px-4 py-3 " +
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
        {sending && <div className="text-[13px] text-ink-subtle italic">Thinking…</div>}
      </div>

      <div className="flex gap-2.5 p-4 border-t border-line-soft">
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
          className="flex-1 text-[14px] px-4 h-11 border border-line rounded-[6px] bg-surface text-ink outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={disabled || sending || !input.trim()}
          className="cursor-pointer text-[14px] font-medium h-11 px-5 rounded-[2px] bg-accent text-accent-ink hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
