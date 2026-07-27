import os
import json
from openai import OpenAI

# Inizializzazione del client OpenAI configurato per Groq
client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

def _language_instruction(language: str) -> str:
    lang = language.lower()
    if lang == "it":
        return "You must write all text fields strictly in Italian."
    elif lang == "es":
        return "You must write all text fields strictly in Spanish."
    return "You must write all text fields strictly in English."

def analyze_match(cv_text: str, job_text: str, language: str = "en") -> dict:
    lang_rule = _language_instruction(language)
    
    prompt = f"""
{lang_rule}
You are an expert ATS and Senior Recruiter. Analyze the match between the CV and the Job Description.

Job Description:
{job_text}

CV:
{cv_text}

Return ONLY valid JSON with this exact structure:
{{
  "match_score": 0,
  "score_breakdown": {{
    "technical_skills": 0,
    "nice_to_have": 0,
    "experience": 0,
    "soft_skills": 0
  }},
  "matching_skills": [],
  "missing_skills": [],
  "summary": "",
  "cv_suggestions": "",
  "interview_questions": []
}}
"""
    if not client:
        raise RuntimeError("OpenAI client not initialized. Check dependencies.")

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    content = response.choices[0].message.content
    clean = content.replace("```json", "").replace("```", "").strip()
    
    try:
        data = json.loads(clean)
        
        if "match_score" not in data:
            data["match_score"] = 50
        if "score_breakdown" not in data or not isinstance(data["score_breakdown"], dict):
            data["score_breakdown"] = {"technical_skills": 50, "nice_to_have": 50, "experience": 50, "soft_skills": 50}
        if "matching_skills" not in data or not isinstance(data["matching_skills"], list):
            data["matching_skills"] = []
        if "missing_skills" not in data or not isinstance(data["missing_skills"], list):
            data["missing_skills"] = []
        if "summary" not in data:
            data["summary"] = "Analysis completed."
        if "cv_suggestions" not in data:
            data["cv_suggestions"] = "Tailor your experience to match the job requirements."
        if "interview_questions" not in data or not isinstance(data["interview_questions"], list):
            data["interview_questions"] = []
            
        return data
    except json.JSONDecodeError as e:
        print(f"ERRORE JSON DECODE (analyze_match): {e}")
        print(f"CONTENUTO RICEVUTO:\n{clean}")
        return {
            "match_score": 0,
            "score_breakdown": {"technical_skills": 0, "nice_to_have": 0, "experience": 0, "soft_skills": 0},
            "matching_skills": [],
            "missing_skills": [],
            "summary": "Error parsing AI response.",
            "cv_suggestions": "Please try again.",
            "interview_questions": []
        }

def career_coach(cv_text: str, target_role: str = "", language: str = "en") -> dict:
    lang_rule = _language_instruction(language)
    
    prompt = f"""
{lang_rule}
You are an expert Career Coach. Analyze the user's CV and optional target role, then provide a comprehensive career coaching report.

CV:
{cv_text}

Target Role: {target_role if target_role else "General career progression"}

Return ONLY valid JSON with this exact structure:
{{
  "standout_summary": "",
  "strengths": [],
  "growth_areas": [],
  "suggested_roles": [
    {{
      "title": "",
      "why": ""
    }}
  ],
  "30_days": [],
  "60_days": [],
  "90_days": [],
  "resources": [
    {{
      "title": "",
      "type": "",
      "why": ""
    }}
  ]
}}
"""
    if not client:
        raise RuntimeError("OpenAI client not initialized. Check dependencies.")

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    content = response.choices[0].message.content
    clean = content.replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(clean)
        
        # Mappa i campi piatti dell'IA nell'oggetto strutturato action_plan atteso da Pydantic
        action_plan_data = {
            "30_days": data.get("30_days", []),
            "60_days": data.get("60_days", []),
            "90_days": data.get("90_days", [])
        }
        
        return {
            "standout_summary": data.get("standout_summary", "Profile analysis complete."),
            "strengths": data.get("strengths", []),
            "growth_areas": data.get("growth_areas", []),
            "suggested_roles": data.get("suggested_roles", []),
            "action_plan": action_plan_data,
            "resources": data.get("resources", [])
        }
    except json.JSONDecodeError as e:
        print(f"ERRORE JSON DECODE (career_coach): {e}")
        print(f"CONTENUTO RICEVUTO:\n{clean}")
        return {
            "standout_summary": "Error parsing AI response.",
            "strengths": [],
            "growth_areas": [],
            "suggested_roles": [],
            "action_plan": {"30_days": [], "60_days": [], "90_days": []},
            "resources": []
        }