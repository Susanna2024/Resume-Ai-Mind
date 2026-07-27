from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import analyze_match
import traceback

# 1. Dichiara il router per primo
router = APIRouter()

class AnalysisRequest(BaseModel):
    cv_text: str
    job_text: str
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

# 2. Usa il router solo dopo la dichiarazione
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