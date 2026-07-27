export interface ScoreBreakdown {
  technical_skills: number
  nice_to_have: number
  experience: number
  soft_skills: number
}

export interface AnalysisResult {
  match_score: number
  match_category?: 'strong' | 'partial' | 'weak'
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

// Struttura potenziata per il piano d'azione con link cliccabili
export interface ActionItem {
  action: string
  detail: string
  link?: string
}

export interface ActionPlan {
  thirty_days: ActionItem[]
  sixty_days: ActionItem[]
  ninety_days: ActionItem[]
}

export interface Resource {
  title: string
  provider?: string
  type?: string
  difficulty?: string
  duration?: string
  why?: string
  url?: string
}

export interface CoachResult {
  readiness_score: number
  readiness_category: 'strong' | 'partial' | 'weak'
  target_role: string
  summary: string
  standout_angle: string
  growth_areas: string[]
  suggested_roles: SuggestedRole[]
  action_plan: ActionPlan
  recommended_resources: Resource[]
}

export type Language = "en" | "es" | "it"
export type Mode = "match" | "coach"