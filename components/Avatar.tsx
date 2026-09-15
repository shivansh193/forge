function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PALETTES: [string, string][] = [
  ["#f97362", "#7a2e22"],
  ["#5b8def", "#1d3f7a"],
  ["#4fb08a", "#1c4a37"],
  ["#c084fc", "#4c1d7a"],
  ["#f4b942", "#7a5205"],
  ["#3fb6c9", "#0d4a55"],
];

export default function Avatar({ seed, size = 40 }: { seed: string; size?: number }) {
  const h = hashSeed(seed);
  const [from, to] = PALETTES[h % PALETTES.length];
  const initials = seed
    .split(/[-\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initials}
    </div>
  );
}
