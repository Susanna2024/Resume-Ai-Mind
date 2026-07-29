import { useState, useEffect } from "react"
import { translations } from "./i18n"

import MatchAnalysis from "./components/MatchAnalysis"
import { CareerCoach } from "./components/CareerCoach"
import type { Language } from "./lib/types"

type View = "home" | "match" | "coach"

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "it", label: "IT" },
]

function App() {
  const [view, setView] = useState<View>("home")
  const [language, setLanguage] = useState<Language>("en")

  const [isGlobalLimitExceeded, setIsGlobalLimitExceeded] = useState<boolean>(false)
  const [_isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true)

  const t = translations[language]
  useEffect(() => {
    const checkGlobalStatus = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || ""
        const response = await fetch(`${API_URL}/api/system-status`)
        if (response.ok) {
          const data = await response.json()
          if (data.limit_exceeded) setIsGlobalLimitExceeded(true)
        }
      } catch (error) {
        console.error("Impossibile connettersi al backend per lo stato", error)
      } finally {
        setIsLoadingStatus(false)
      }
    }
    checkGlobalStatus()
  }, [])
  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden font-sans">

      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[350px] bg-gradient-to-r ${
          view === "coach"
            ? "from-[#dfa245]/15 via-transparent to-transparent"
            : "from-[#5993ef]/10 via-transparent to-transparent"
        } blur-3xl pointer-events-none rounded-full transition-all duration-700`}
      />

      {/* HEADER */}
      <header className="w-full border-b border-border/60 bg-surface/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between gap-4">

          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <span
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0"
              style={{ background: 'linear-gradient(135deg, #5993ef, #dfa245)' }}
            />
            <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-wide uppercase leading-none">
              <span className="text-white">RESUM</span>
              <span style={{ color: '#5993ef' }}>AI</span>
              <span style={{ color: '#dfa245' }}>MIND</span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Badge Limite Giornaliero (Opzione 2) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border/80 text-[11px] font-mono tracking-tight text-ink-muted shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #5993ef, #dfa245)' }}></span>
              <span>{language === "it" ? "5 analisi / giorno" : language === "es" ? "5 análisis / día" : "5 analyses / day"}</span>
            </div>

            <div className="flex bg-surface border border-border/80 rounded-lg p-1">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-display font-bold tracking-wider transition-all ${
                    language === code
                      ? "bg-surface-2 text-ink shadow-xs"
                      : "text-ink-faint hover:text-ink-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={`flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-md border text-[11px] sm:text-xs font-mono tracking-tight ${
              isGlobalLimitExceeded
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-surface border-border/80 text-ink-muted"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isGlobalLimitExceeded ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span>{isGlobalLimitExceeded ? t.globalLimitTitle : t.systemLive}</span>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-2xl lg:max-w-3xl mx-auto px-6 pt-10 sm:pt-12 pb-20 relative z-10">

        {isGlobalLimitExceeded && (
          <div className="mb-8 p-6 rounded-2xl bg-surface border border-amber-500/30 text-center shadow-xl shadow-amber-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-amber-400 mb-2">
              {t.globalLimitTitle}
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-lg mx-auto">
              {t.globalLimitDesc}
            </p>
          </div>
        )}

        {/* ============ HOME: landing di scelta, simmetrica ed equilibrata ============ */}
        {view === "home" && (
          <>
            <div className="text-center mb-14 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#5993ef]/10 to-[#dfa245]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border/80 text-[11px] font-mono uppercase tracking-widest text-ink-muted mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t.systemLive ?? "Sistema attivo"} // SUITE
              </div>

              {/* Titolo Principale Dinamico e Tradotto (Ottimizzato) */}
             <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase font-display text-white mb-4 leading-[0.95]">
                <span className="text-white">{t.heroTitleLine1 ?? "Due strumenti."}</span><br />
                <span className="text-[#5993ef]">{t.heroTitleLine2 ?? "Un solo obiettivo:"}</span><br />
                <span className="text-[#dfa245]">{t.heroTitleLine3 ?? "il lavoro giusto."}</span>
              </h1>
              <p className="text-ink-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-light">
                {t.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">

              {/* CARD MATCH SCORE — Azzurro */}
              <button
                onClick={() => setView("match")}
                className="relative text-left p-8 sm:p-10 rounded-3xl border border-border bg-surface/60 hover:bg-surface hover:border-[#5993ef]/60 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5993ef]/10 border border-[#5993ef]/20 text-[10px] font-mono uppercase tracking-widest text-[#5993ef] mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5993ef]"></span>
                    ATS_ENGINE
                  </div>

                  <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider mb-3 text-white group-hover:text-[#5993ef] transition-colors leading-tight">
                    {t.matchScore}
                  </h2>
                  
                  <p className="text-ink-muted leading-relaxed text-sm font-light mb-8">
                    {t.badgeMatch}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/80 w-full flex items-center justify-between">
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-[#5993ef]">
                    {t.analyzeMatch}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#5993ef]/10 flex items-center justify-center group-hover:translate-x-1.5 transition-all">
                    <span className="text-[#5993ef] font-bold text-xs">→</span>
                  </div>
                </div>
              </button>

              {/* CARD CAREER COACHING — Giallo/Oro */}
              <button
                onClick={() => setView("coach")}
                className="relative text-left p-8 sm:p-10 rounded-3xl border border-border bg-surface/60 hover:bg-surface hover:border-[#dfa245]/60 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfa245]/10 border border-[#dfa245]/20 text-[10px] font-mono uppercase tracking-widest text-[#dfa245] mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dfa245]"></span>
                    STRATEGIC_AI
                  </div>

                  <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-wider mb-3 text-white group-hover:text-[#dfa245] transition-colors leading-tight">
                    {t.careerCoachingButton}
                  </h2>
                  
                  <p className="text-ink-muted leading-relaxed text-sm font-light mb-8">
                    {t.badgeCoach}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/80 w-full flex items-center justify-between">
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-[#dfa245]">
                    {t.getCareerCoaching}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#dfa245]/10 flex items-center justify-center group-hover:translate-x-1.5 transition-all">
                    <span className="text-[#dfa245] font-bold text-xs">→</span>
                  </div>
                </div>
              </button>

            </div>
          </>
        )}

        {/* ============ MATCH SCORE ============ */}
        {view === "match" && (
          <>
            <button
              onClick={() => setView("home")}
              className="mb-6 text-xs font-display font-bold uppercase tracking-wider text-ink-faint hover:text-ink-muted transition-colors"
            >
              ← {t.backToTools ?? "Tutti gli strumenti"}
            </button>

            <div className="text-center mb-10">
              <div className="inline-block mb-4">
                <span className="font-display text-[10px] font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full bg-surface border border-border/80 text-ink-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5993ef' }}></span>
                  {t.badgeMatch}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase font-display text-white mb-3">
                {t.heroMatchTitle} <br />
                <span style={{ color: '#5993ef' }}>{t.heroMatchHighlight}</span>
              </h1>
              <p className="text-ink-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                {t.heroMatchDesc}
              </p>
            </div>

            <div className={`transition-all duration-300 ${isGlobalLimitExceeded ? 'opacity-40 pointer-events-none select-none' : ''}`}>
              <MatchAnalysis language={language} />
            </div>
          </>
        )}

        {/* ============ CAREER COACHING ============ */}
        {view === "coach" && (
          <>
            <button
              onClick={() => setView("home")}
              className="mb-6 text-xs font-display font-bold uppercase tracking-wider text-ink-faint hover:text-ink-muted transition-colors"
            >
              ← {t.backToTools ?? "Tutti gli strumenti"}
            </button>

            <div className="text-center mb-10">
              <div className="inline-block mb-4">
                <span className="font-display text-[10px] font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full bg-surface border border-border/80 text-ink-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#dfa245' }}></span>
                  {t.badgeCoach}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase font-display text-white mb-3">
                {t.heroCoachTitle} <br />
                <span style={{ color: '#dfa245' }}>{t.heroCoachHighlight}</span>
              </h1>
              <p className="text-ink-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                {t.heroCoachDesc}
              </p>
            </div>

            <div className={`transition-all duration-300 ${isGlobalLimitExceeded ? 'opacity-40 pointer-events-none select-none' : ''}`}>
              <CareerCoach language={language} />
            </div>
          </>
        )}

        <footer className="text-center mt-20 pt-8 border-t border-border/60 text-ink-faint text-[11px] font-mono tracking-wider">
          {t.footer}
        </footer>

      </main>
    </div>
  )
}

export default App