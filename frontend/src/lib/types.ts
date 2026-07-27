export interface ScoreBreakdown {
  technical_skills: number
  nice_to_have: number
  experience: number
  soft_skills: number
}

export interface AnalysisResult {
  match_score: number
  score_breakdown?: ScoreBreakdown | null
  matching_skills: string[]
  missing_skills: string[]
  summary: string
  cv_suggestions: string
  interview_questions: string[]
}

export interface SuggestedRole {
  title: string
  why: string
}

export interface ActionPlan {
  thirty_days: string[]
  sixty_days: string[]
  ninety_days: string[]
}

export interface Resource {
  title: string
  type: string
  why: string
}

export interface CoachResult {
  standout_summary: string
  strengths: string[]
  growth_areas: string[]
  suggested_roles: SuggestedRole[]
  action_plan: ActionPlan
  resources: Resource[]
}

export type Language = "en" | "es" | "it"
export type Mode = "match" | "coach"
