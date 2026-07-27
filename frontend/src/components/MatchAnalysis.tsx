import { useState } from "react"
import CVDropZone from "./CVDropZone"
import JobOfferInput from "./JobOfferInput"
import ScoreRing from "./ScoreRing"
import { analyzeMatch } from "../lib/api"
import type { AnalysisResult, Language } from "../lib/types"
import { translations } from "../i18n"

const BREAKDOWN_LABELS: Record<string, [string, number]> = {
  technical_skills: ["Technical skills", 50],
  nice_to_have: ["Nice-to-have", 20],
  experience: ["Experience level", 15],
  soft_skills: ["Soft skills & fit", 15],
}

export default function MatchAnalysis({ language }: { language: Language }) {
  const t = translations[language]

  const [cvText, setCvText] = useState("")
  const [jobText, setJobText] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analyze = async () => {
    console.log("CV Text length:", cvText.length)
    console.log("Job Text length:", jobText.length)

    if (!cvText || !jobText) {
      setError(t.errorMissingInput)
      return
    }

    setLoading(true)
    setError("")

    try {
      const data = await analyzeMatch(cvText, jobText, language)
      setResult(data)
    } catch (e) {
      setError(t.errorGeneric)
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <CVDropZone onFileLoaded={setCvText} />
        <JobOfferInput value={jobText} onChange={setJobText} />
      </div>

      {/* Fallback di input testuale con id e name per rispettare i requisiti dei form */}
      <div className="mb-6 bg-surface p-4 rounded-2xl border border-border">
        <label 
          htmlFor="cv-text-fallback" 
          className="block text-xs font-mono text-ink-muted mb-2 uppercase"
        >
          O inserisci/incolla il testo del CV manualmente
        </label>
        <textarea
          id="cv-text-fallback"
          name="cvTextManual"
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="Incolla qui il contenuto del CV se necessario..."
          className="w-full h-24 bg-surface-2 p-3 rounded-xl text-sm text-ink border border-border focus:outline-none focus:border-match resize-none"
        />
      </div>

      <button
        onClick={analyze}
        disabled={loading}
        className="w-full bg-match hover:brightness-110 disabled:bg-surface-2 disabled:text-ink-faint text-white font-display font-semibold py-3 px-6 rounded-xl transition-all"
      >
        {loading ? t.analyzing : t.analyzeMatch}
      </button>

      {error && <p className="text-gap mt-4 text-sm font-medium">{error}</p>}

      {result && (
        <div className="space-y-5 mt-8">

          <div className="bg-surface rounded-2xl p-8 border border-border flex flex-col items-center fade-in">
            <ScoreRing score={result.match_score} />

            {result.score_breakdown && (
              <div className="w-full max-w-sm mt-6 space-y-2">
                {Object.entries(result.score_breakdown).map(([key, val]) => {
                  const [label, max] = BREAKDOWN_LABELS[key] ?? [key, 100]

                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs font-mono text-ink-muted mb-1">
                        <span>{label}</span>
                        <span>{val}/{max}</span>
                      </div>

                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full bg-match rounded-full transition-all duration-700"
                          style={{ width: `${(val / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-1">
              <h3 className="font-display font-semibold text-good mb-3 text-sm uppercase tracking-wide">
                {t.matchingSkills}
              </h3>

              <div className="flex flex-wrap gap-2">
                {result.matching_skills.map((s) => (
                  <span
                    key={s}
                    className="skill-chip bg-good-soft text-good border-good/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>


            <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-1">
              <h3 className="font-display font-semibold text-gap mb-3 text-sm uppercase tracking-wide">
                {t.missingSkills}
              </h3>

              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((s) => (
                  <span
                    key={s}
                    className="skill-chip bg-gap-soft text-gap border-gap/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

          </div>


          <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-2">
            <h3 className="font-display font-semibold text-match mb-3 text-sm uppercase tracking-wide">
              {t.analysis}
            </h3>

            <p className="text-ink-muted leading-relaxed">
              {result.summary}
            </p>
          </div>


          <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-2">
            <h3 className="font-display font-semibold text-coach mb-3 text-sm uppercase tracking-wide">
              {t.cvSuggestions}
            </h3>

            <p className="text-ink-muted leading-relaxed">
              {result.cv_suggestions}
            </p>
          </div>


          <div className="bg-surface rounded-2xl p-6 border border-border fade-in fade-in-delay-3">

            <h3 className="font-display font-semibold text-ink mb-3 text-sm uppercase tracking-wide">
              {t.interviewQuestions}
            </h3>

            <ul className="space-y-2">
              {result.interview_questions.map((q, i) => (
                <li
                  key={i}
                  className="text-ink-muted leading-relaxed flex gap-2"
                >
                  <span className="text-ink-faint font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {q}
                </li>
              ))}
            </ul>

          </div>

        </div>
      )}
    </div>
  )
}