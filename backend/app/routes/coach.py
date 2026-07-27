from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import career_coach_multi_path  # Importa la funzione multi-path
import traceback

router = APIRouter()

class CoachRequest(BaseModel):
    cv_text: str
    target_role: str = ""
    language: str = "en"

# Rimuoviamo 'response_model=CoachResponse' per evitare conflitti di validazione 
# e usiamo la nuova funzione multi-path.
@router.post("/coach")
async def coach(request: CoachRequest):
    try:
        result = career_coach_multi_path(
            cv_text=request.cv_text,
            language=request.language
        )
        return result
    except Exception as e:
        print(f"ERROR in /api/coach: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))