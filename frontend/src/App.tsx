import { useState } from "react"
import { translations } from "./i18n"

import MatchAnalysis from "./components/MatchAnalysis"
import { CareerCoach }from "./components/CareerCoach"
import type { Language, Mode } from "./lib/types"

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "it", label: "IT" },
]

function App() {
  const [mode, setMode] = useState<Mode>("match")
  const [language, setLanguage] = useState<Language>("en")

  const t = translations[language]

  const accent = mode === "match" ? "text-match" : "text-coach"

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="max-w-3xl mx-auto px-5 py-10 sm:py-16">

        <header className="text-center mb-10">

          <p className="font-mono text-xs text-ink-faint tracking-widest uppercase mb-3">
            {t.openSource}
          </p>

          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-3">
            CVMatch <span className={accent}>AI</span>
          </h1>

          <p className="text-ink-muted max-w-md mx-auto leading-relaxed">
            {t.appSubtitle}
          </p>

        </header>


        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">

          <div className="flex bg-surface border border-border rounded-full p-1 w-full sm:w-auto">

            <button
              onClick={() => setMode("match")}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-sm font-display font-medium transition-colors ${
                mode === "match"
                  ? "bg-match text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.matchScore}
            </button>


            <button
              onClick={() => setMode("coach")}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-sm font-display font-medium transition-colors ${
                mode === "coach"
                  ? "bg-coach text-bg"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.careerReadiness}
            </button>

          </div>


          <div className="flex bg-surface border border-border rounded-full p-1">

            {LANGUAGES.map(({ code, label }) => (

              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                  language === code
                    ? "bg-surface-2 text-ink"
                    : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                {label}
              </button>

            ))}

          </div>

        </div>


        {mode === "match" ? (
          <MatchAnalysis language={language} />
        ) : (
          <CareerCoach language={language} />
        )}


        <footer className="text-center mt-16 text-ink-faint text-xs">
          {t.footer}
        </footer>


      </div>
    </div>
  )
}

export default App