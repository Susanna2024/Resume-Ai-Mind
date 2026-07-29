from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from app.services.ai_service import analyze_match, career_coach_multi_path
import traceback
import pypdf # Assicurati di avere pypdf o pdfplumber installato nel backend

router = APIRouter()

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

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    import io
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text

# 1. Rotta per l'analisi CV (ora riceve un file binario via FormData)
@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    job_text: str = Form(...),
    language: str = Form("en")
):
    try:
        # Leggiamo i byte del PDF caricato dal client
        pdf_bytes = await file.read()
        
        # Estraiamo il testo lato server in modo robusto
        cv_text = extract_text_from_pdf(pdf_bytes)
        
        if not cv_text.strip():
            raise HTTPException(status_code=400, detail="Impossibile estrarre testo dal PDF o file vuoto.")

        result = analyze_match(
            cv_text=cv_text,
            job_text=job_text,
            language=language
        )
        return result
    except Exception as e:
        print("--- ERRORE DURANTE L'ANALISI ---")
        traceback.print_exc()
        print("--------------------------------")
        raise HTTPException(status_code=500, detail=str(e))

# 2. Rotta per il Career Coach Multi-Path (rimane basata su JSON inviato dal client)
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