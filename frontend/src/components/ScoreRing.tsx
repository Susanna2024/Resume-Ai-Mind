function scoreColor(score: number) {
  if (score >= 70) return "var(--color-good)"
  if (score >= 50) return "var(--color-coach)"
  return "var(--color-gap)"
}

interface ScoreRingProps {
  score: number
  category?: string
}

export default function ScoreRing({ score, category }: ScoreRingProps) {
  const color = scoreColor(score)

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full grid place-items-center transition-[background] duration-700"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, var(--color-surface-2) 0deg)`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-bg" />
        <div className="relative flex flex-col items-center">
          <span
            className="font-display font-bold text-4xl sm:text-5xl tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-ink-faint text-xs font-mono mt-1">/ 100</span>
        </div>
      </div>
      {category && (
        <p className="font-mono text-xs uppercase tracking-wider" style={{ color }}>
          {category}
        </p>
      )}
    </div>
  )
}