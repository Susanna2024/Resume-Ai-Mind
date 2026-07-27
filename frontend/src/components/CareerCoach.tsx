import { useState } from "react"
import CVDropZone from "./CVDropZone"
import { getCareerCoaching } from "../lib/api"
import type { CoachResult, Language } from "../lib/types"

const PLAN_STAGES: { key: keyof CoachResult["action_plan"]; label: string }[] = [
  { key: "thirty_days", label: "First 30 days" },
  { key: "sixty_days", label: "Days 30–60" },
  { key: "ninety_days", label: "Days 60–90" },
]

export default function CareerCoach({ language }: { language: Language }) {
  const [cvText, setCvText] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [result, setResult] = useState<CoachResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const runCoaching = async () => {
    if (!cvText) {
      setError("Please upload your CV first.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const data = await getCareerCoaching(cvText, targetRole, language)
      setResult(data)
    } catch (e) {
      setError("Something went wrong. Please try again.")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <CVDropZone onFileLoaded={setCvText} />
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-2">
            Target role <span className="text-ink-faint font-normal">(optional)</span>
          </label>
          <input
            type="text"
            className="w-full bg-surface border border-border rounded-xl p-3 text-ink focus:outline-none focus:border-coach text-sm placeholder:text-ink-faint mb-3"
            placeholder="e.g. Junior Growth Engineer, Product Manager…"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
          <p className="text-ink-faint text-xs leading-relaxed">
            Leave this blank if you'd like the coach to suggest directions based on your background instead.
          </p>
        </div>
      </div>

      <button
        onClick={runCoaching}
        disabled={loading}
        className="w-full bg-coach hover:brightness-110 disabled:bg-surface-2 disabled:text-ink-faint text-bg font-display font-semibold py-3 px-6 rounded-xl transition-all"
      >
        {loading ? "Coaching in progress…" : "Get career coaching"}
      </button>

      {error && <p className="text-gap mt-4 text-sm">{error}</p>}

      {result && (
        <div className="space-y-5 mt-8">
          <div className="bg-surface rounded-2xl p-6 border border-border fade-in">
            <h3 className="font-display font-semibold text-coach mb-3 text-sm uppercase tracking-wide">Your standout angle</h3>
            <p className="text-ink-muted leading-relaxed">{result.standout_summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-1">
              <h3 className="font-display font-semibold text-good mb-3 text-sm uppercase tracking-wide">Strengths</h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-ink-muted text-sm leading-relaxed flex gap-2">
                    <span className="text-good">＋</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-1">
              <h3 className="font-display font-semibold text-coach mb-3 text-sm uppercase tracking-wide">Growth areas</h3>
              <ul className="space-y-2">
                {result.growth_areas.map((s, i) => (
                  <li key={i} className="text-ink-muted text-sm leading-relaxed flex gap-2">
                    <span className="text-coach">↗</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {result.suggested_roles?.length > 0 && (
            <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-2">
              <h3 className="font-display font-semibold text-match mb-4 text-sm uppercase tracking-wide">Suggested roles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.suggested_roles.map((r, i) => (
                  <div key={i} className="bg-surface-2 rounded-xl p-4 border border-border">
                    <p className="font-medium text-ink text-sm mb-1">{r.title}</p>
                    <p className="text-ink-faint text-xs leading-relaxed">{r.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-2">
            <h3 className="font-display font-semibold text-ink mb-5 text-sm uppercase tracking-wide">90-day action plan</h3>
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {PLAN_STAGES.map(({ key, label }, i) => (
                <div key={key} className="relative">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-coach ring-4 ring-bg" />
                  <p className="font-mono text-xs text-coach mb-2">{String(i + 1).padStart(2, "0")} · {label}</p>
                  <ul className="space-y-1.5">
                    {(result.action_plan[key] ?? []).map((item, j) => (
                      <li key={j} className="text-ink-muted text-sm leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {result.resources?.length > 0 && (
            <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-3">
              <h3 className="font-display font-semibold text-ink mb-4 text-sm uppercase tracking-wide">Recommended resources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.resources.map((r, i) => (
                  <div key={i} className="bg-surface-2 rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-ink text-sm">{r.title}</p>
                      <span className="skill-chip bg-match-soft text-match border-match/30 shrink-0">{r.type}</span>
                    </div>
                    <p className="text-ink-faint text-xs leading-relaxed">{r.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
