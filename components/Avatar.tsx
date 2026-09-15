function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PALETTES: [string, string][] = [
  ["#7a5ea8", "#4b3a72"],
  ["#3f8f86", "#245a53"],
  ["#5470a6", "#2f3a5c"],
  ["#c8933f", "#8a5f1e"],
  ["#b8654f", "#7a3d2c"],
  ["#7a9470", "#4a5f42"],
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
      className="flex items-center justify-center font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.29,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initials}
    </div>
  );
}
