import React, { useState } from "react";
import { translations } from "../i18n";
import type { Language } from "../lib/types";
import ScoreRing from "./ScoreRing";
import CVDropZone from "./CVDropZone";
import { getCareerCoaching, analyzeMatch } from "../lib/api";
import { Sparkles, BookOpen, Compass, CheckCircle2, ExternalLink, Layers } from "lucide-react";
import { trackEvent } from "../lib/analytics";

interface CareerCoachProps {
  language: Language;
}

export const CareerCoach: React.FC<CareerCoachProps> = ({ language }) => {
  const t = translations[language] || translations.en;
  // Modificato: ora memorizziamo l'oggetto File anziché la stringa
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [activePathIndex, setActivePathIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!cvFile) {
      setError(t.uploadCvFirst);
      return;
    }
    setLoading(true);
    setError(null);
    trackEvent("coach_requested", { language, has_target_role: Boolean(targetRole) });
    try {
      // 1. Esegui l'analisi passando il File e il targetRole come descrizione del lavoro
      const analysisData = await analyzeMatch(cvFile, targetRole || "Professional role", language);
      
      // 2. Recuperiamo il coach_context in modo sicuro
      const context = (analysisData as any).coach_context || {
        match_score: analysisData.match_score || 70,
        score_breakdown: analysisData.score_breakdown || {},
        matching_skills: analysisData.matching_skills || [],
        missing_skills: analysisData.missing_skills || [],
        summary: analysisData.summary || "",
        cv_suggestions: analysisData.cv_suggestions || "",
        interview_questions: analysisData.interview_questions || []
      };
      
      // 3. Passiamo il contesto al career coach
      const data = await getCareerCoaching(context, targetRole, language);
      
      setResult(data);
      setActivePathIndex(0);
      trackEvent("coach_completed", { language });
    } catch (err: any) {
      setError(err.message || t.errorGeneric);
      trackEvent("coach_error", { language });
    } finally {
      setLoading(false);
    }
  };

  const pathsList = result?.paths || result?.career_paths || result?.percorsi || (result ? [result] : []);
  const currentPath = pathsList[activePathIndex] || pathsList[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-text-main">{t.getCareerCoaching}</h2>
        <p className="text-text-muted">{t.coachSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-text-main">{t.yourCv}</label>
          <CVDropZone onFileLoaded={setCvFile} language={language} />
        </div>
        <div className="space-y-4 flex flex-col justify-between">
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">{t.targetRoleOptional}</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder={t.targetRolePlaceholder}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <p className="text-xs text-text-muted mt-2">{t.targetRoleHelp}</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !cvFile}
            className="w-full py-3.5 px-6 bg-[var(--color-coach)] hover:brightness-90 disabled:opacity-50 text-black font-semibold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{t.analyzeMatch}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-center">
          {error}
        </div>
      )}

      {result && currentPath && (
        <div className="space-y-8 animate-fadeIn">

          {result.candidate_overview && (
            <p className="text-center text-text-muted max-w-2xl mx-auto leading-relaxed">
              {result.candidate_overview}
            </p>
          )}

          {pathsList.length > 1 && (
            <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center justify-center space-x-3 overflow-x-auto">
              <Layers className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-text-main mr-2">{t.careerPathsLabel}</span>
              {pathsList.map((path: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setActivePathIndex(index)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activePathIndex === index
                      ? "bg-color-coach-soft text-color-coach font-semibold shadow-md border border-color-coach/30"
                      : "bg-background text-text-main hover:bg-surface border border-border"
                  }`}
                >
                  {path.role_name || path.target_role || path.role || path.title || path.name || path.career_path || targetRole || `${t.professionalPathFallback} ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center gap-8">
            <ScoreRing
              score={currentPath.readiness_score || 70}
              category={currentPath.readiness_category}
            />
            <div className="space-y-3 flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-text-main">
                {currentPath.role_name || currentPath.target_role || currentPath.role || currentPath.title || currentPath.name || currentPath.career_path || targetRole || t.professionalPathFallback}
              </h3>
              <p className="text-text-muted leading-relaxed">
                {currentPath.fit_explanation || currentPath.summary}
              </p>
              {currentPath.standout_angle && (
                <div className="p-3 bg-background rounded-xl border border-border inline-block">
                  <span className="text-xs font-semibold text-amber-500 block">{t.standoutAngleLabel}</span>
                  <span className="text-sm text-text-main">{currentPath.standout_angle}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-text-main flex items-center space-x-2">
              <Compass className="w-6 h-6 text-amber-500" />
              <span>{t.actionPlan}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 p-5 bg-background rounded-xl border border-border">
                <h4 className="font-bold text-text-main border-b border-border pb-2">{t.thirtyDaysLabel}</h4>
                <div className="space-y-4">
                  {currentPath.action_plan?.thirty_days?.map((item: any, index: number) => (
                    <div key={index} className="space-y-1 text-sm">
                      <div className="font-semibold text-text-main flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item.action}</span>
                      </div>
                      <p className="text-text-muted text-xs pl-6">{item.detail}</p>
                      {item.link && (
                        <div className="pl-6 pt-1">
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-xs text-amber-500 hover:underline font-medium">
                            <span>{t.viewResource}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-5 bg-background rounded-xl border border-border">
                <h4 className="font-bold text-text-main border-b border-border pb-2">{t.sixtyDaysLabel}</h4>
                <div className="space-y-4">
                  {currentPath.action_plan?.sixty_days?.map((item: any, index: number) => (
                    <div key={index} className="space-y-1 text-sm">
                      <div className="font-semibold text-text-main flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item.action}</span>
                      </div>
                      <p className="text-text-muted text-xs pl-6">{item.detail}</p>
                      {item.link && (
                        <div className="pl-6 pt-1">
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-xs text-amber-500 hover:underline font-medium">
                            <span>{t.viewResource}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-5 bg-background rounded-xl border border-border">
                <h4 className="font-bold text-text-main border-b border-border pb-2">{t.ninetyDaysLabel}</h4>
                <div className="space-y-4">
                  {currentPath.action_plan?.ninety_days?.map((item: any, index: number) => (
                    <div key={index} className="space-y-1 text-sm">
                      <div className="font-semibold text-text-main flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item.action}</span>
                      </div>
                      <p className="text-text-muted text-xs pl-6">{item.detail}</p>
                      {item.link && (
                        <div className="pl-6 pt-1">
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-xs text-amber-500 hover:underline font-medium">
                            <span>{t.viewResource}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-text-main flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              <span>{t.recommendedResources}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(currentPath.recommended_resources || currentPath.resources)?.map((res: any, index: number) => (
                <div key={index} className="p-4 bg-background rounded-xl border border-border flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md">
                      {res.provider || res.type || t.resourceFallback}
                    </span>
                    <h4 className="font-bold text-text-main mt-2">{res.title}</h4>
                    {res.why && <p className="text-xs text-text-muted mt-1">{res.why}</p>}
                  </div>
                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-sm text-amber-500 hover:underline font-semibold mt-auto pt-2 border-t border-border/50"
                    >
                      <span>{t.viewResource}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};