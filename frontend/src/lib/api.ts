import axios from "axios"
import type { AnalysisResult, CoachResult, Language } from "./types"

const API_URL = import.meta.env.VITE_API_URL || ""

export async function analyzeMatch(
  cvFile: File,
  jobText: string,
  language: Language
): Promise<AnalysisResult> {
  const formData = new FormData()
  formData.append("file", cvFile)
  formData.append("job_text", jobText)
  formData.append("language", language)

  const { data } = await axios.post(`${API_URL}/api/analyze`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return data
}

export async function getCareerCoaching(
  coachContext: Record<string, any>,
  targetRole: string,
  language: Language
): Promise<CoachResult> {
  const { data } = await axios.post(`${API_URL}/api/coach`, {
    coach_context: coachContext,
    target_role: targetRole,
    language,
  })
  return data
}