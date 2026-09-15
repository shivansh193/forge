import { DiffToken } from "@/lib/diff";

export default function DiffView({ tokens }: { tokens: DiffToken[] }) {
  return (
    <div className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words">
      {tokens.map((t, i) => {
        if (t.added) {
          return (
            <span key={i} className="bg-ok-bg text-ok">
              {t.value}
            </span>
          );
        }
        if (t.removed) {
          return (
            <span key={i} className="bg-bad-bg text-bad line-through">
              {t.value}
            </span>
          );
        }
        return (
          <span key={i} className="text-ink-faint">
            {t.value}
          </span>
        );
      })}
    </div>
  );
}
