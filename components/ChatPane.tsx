"use client";

import { useState } from "react";
import { ChatMessage } from "@/lib/types";

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
    <div className="border border-line rounded-md bg-surface shadow-[var(--shadow-card)] flex flex-col h-[560px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint px-5 pt-4 pb-3 border-b border-line-soft">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {history.length === 0 && (
          <div className="text-[13px] text-ink-subtle italic">
            No messages yet — try the agent below.
          </div>
        )}
        {history.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                "inline-block max-w-[85%] text-left text-[13px] leading-relaxed rounded-md px-3.5 py-2.5 " +
                (m.role === "user"
                  ? "bg-accent-soft text-ink"
                  : "bg-surface-soft border border-line-soft text-ink-muted")
              }
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {sending && <div className="text-[12px] text-ink-subtle italic">Thinking…</div>}
      </div>

      <div className="flex gap-2 p-4 border-t border-line-soft">
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
          className="flex-1 text-[13px] px-3 py-2.5 border border-line rounded-sm bg-surface text-ink outline-none focus:border-ink-subtle disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={disabled || sending || !input.trim()}
          className="cursor-pointer text-[13px] font-semibold px-4 py-2.5 rounded-sm bg-accent text-accent-ink disabled:opacity-35 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
