from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import analyze_match, career_coach_multi_path
import traceback

router = APIRouter()

class AnalysisRequest(BaseModel):
    cv_text: str
    job_text: str
    language: str = "en"

class CoachRequest(BaseModel):
    coach_context: Dict[str, Any]
    target_role: str = ""
    language: str = "en"

class ScoreBreakdown(BaseModel):
    technical_skills: int
    nice_to_have: int
    experience: int
    soft_skills: int

class AnalysisResponse(BaseModel):
    match_score: int
    score_breakdown: Optional[ScoreBreakdown] = None
    matching_skills: list
    missing_skills: list
    summary: str
    cv_suggestions: str
    interview_questions: list
    coach_context: Optional[Dict[str, Any]] = None

# 1. Rotta per l'analisi CV vs Job Description
@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    try:
        result = analyze_match(
            cv_text=request.cv_text,
            job_text=request.job_text,
            language=request.language
        )
        return result
    except Exception as e:
        print("--- ERRORE DURANTE L'ANALISI ---")
        traceback.print_exc()
        print("--------------------------------")
        raise HTTPException(status_code=500, detail=str(e))

# 2. Rotta per il Career Coach Multi-Path (usiamo Dict[str, Any] per evitare errori di validazione Pydantic)
@router.post("/coach", response_model=Dict[str, Any])
async def coach(request: CoachRequest):
    try:
        result = career_coach_multi_path(
            coach_context=request.coach_context,
            target_role=request.target_role,
            language=request.language
        )
        return result
    except Exception as e:
        print("--- ERRORE DURANTE IL COACHING MULTI-PATH ---")
        traceback.print_exc()
        print("---------------------------------------------")
        raise HTTPException(status_code=500, detail=str(e))