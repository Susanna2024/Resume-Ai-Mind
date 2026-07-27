from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.ai_service import career_coach

router = APIRouter()

class CoachRequest(BaseModel):
    cv_text: str
    target_role: str = ""
    language: str = "en"

class SuggestedRole(BaseModel):
    title: str
    why: str

class ActionPlan(BaseModel):
    thirty_days: list[str] = Field(default_factory=list, alias="30_days")
    sixty_days: list[str] = Field(default_factory=list, alias="60_days")
    ninety_days: list[str] = Field(default_factory=list, alias="90_days")

    model_config = {"populate_by_name": True}

class Resource(BaseModel):
    title: str
    type: str
    why: str

class CoachResponse(BaseModel):
    standout_summary: str
    strengths: list[str]
    growth_areas: list[str]
    suggested_roles: list[SuggestedRole]
    action_plan: ActionPlan
    resources: list[Resource]

@router.post("/coach", response_model=CoachResponse)
async def coach(request: CoachRequest):
    try:
        result = career_coach(
            cv_text=request.cv_text,
            target_role=request.target_role,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
