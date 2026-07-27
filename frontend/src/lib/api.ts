import axios from "axios"
import type { AnalysisResult, CoachResult, Language } from "./types"

// Empty string = relative paths (/api/...). Works out of the box both in local
// dev (Vite's proxy in vite.config.ts forwards /api to the backend) and in a
// combined single-service deployment (FastAPI serving the built frontend).
// Only set VITE_API_URL if the frontend and backend are deployed separately.
const API_URL = import.meta.env.VITE_API_URL || ""

export async function analyzeMatch(
  cvText: string,
  jobText: string,
  language: Language
): Promise<AnalysisResult> {
  const { data } = await axios.post(`${API_URL}/api/analyze`, {
    cv_text: cvText,
    job_text: jobText,
    language,
  })
  return data
}

export async function getCareerCoaching(
  cvText: string,
  targetRole: string,
  language: Language
): Promise<CoachResult> {
  const { data } = await axios.post(`${API_URL}/api/coach`, {
    cv_text: cvText,
    target_role: targetRole,
    language,
  })
  return data
}
