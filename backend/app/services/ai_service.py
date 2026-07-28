import os
import json
import re
from urllib.parse import quote_plus
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

# Modello principale (qualità migliore) con fallback automatico se finiscono
# i token / rate limit / la richiesta fallisce per motivi di quota.
COACH_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
ANALYZE_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]

# --- Costruzione link affidabili (mai generati dall'IA) -------------------

# Domini noti per ogni provider. Non puntiamo MAI direttamente alla loro
# pagina di ricerca interna (cambia spesso, richiede login, o può 404):
# passiamo sempre da una ricerca Google "site:dominio", che non può mai
# restituire 404 perché a rispondere è sempre Google, non il sito terzo.
PROVIDER_DOMAINS = {
    "coursera": "coursera.org",
    "udemy": "udemy.com",
    "linkedin_learning": "linkedin.com/learning",
    "freecodecamp": "freecodecamp.org",
    "mdn": "developer.mozilla.org",
}

def _build_resource_url(provider: str, query: str) -> str:
    """Costruisce sempre un link garantito funzionante. Mai un deep-link
    inventato dall'IA verso una pagina che potrebbe non esistere."""
    key = (provider or "").strip().lower().replace(" ", "_")
    q = (query or provider or "").strip()

    if key == "youtube":
        # La pagina risultati di YouTube è nativamente affidabile.
        return f"https://www.youtube.com/results?search_query={quote_plus(q)}"

    domain = PROVIDER_DOMAINS.get(key)
    if domain:
        return f"https://www.google.com/search?q={quote_plus(f'site:{domain} {q}')}"

    # Provider sconosciuto o non riconosciuto: ricerca Google generica,
    # sempre valida.
    return f"https://www.google.com/search?q={quote_plus(q)}"

def _attach_links_to_resources(resources: list) -> list:
    fixed = []
    for r in resources or []:
        if not isinstance(r, dict):
            continue
        provider = r.get("provider", "")
        topic = r.get("resource_query") or r.get("title") or provider
        r["url"] = _build_resource_url(provider, topic)
        fixed.append(r)
    return fixed

def _attach_links_to_action_items(items: list) -> list:
    fixed = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        provider = item.get("resource_provider", "")
        topic = item.get("resource_query") or item.get("action", "")
        if provider or topic:
            item["link"] = _build_resource_url(provider or "google", topic)
        fixed.append(item)
    return fixed

def _postprocess_path(path: dict) -> dict:
    ap = path.get("action_plan", {}) or {}
    ap["thirty_days"] = _attach_links_to_action_items(ap.get("thirty_days", []))
    ap["sixty_days"] = _attach_links_to_action_items(ap.get("sixty_days", []))
    ap["ninety_days"] = _attach_links_to_action_items(ap.get("ninety_days", []))
    path["action_plan"] = ap
    path["recommended_resources"] = _attach_links_to_resources(path.get("recommended_resources", []))

    empty_stages = [k for k in ("thirty_days", "sixty_days", "ninety_days") if not ap[k]]
    if empty_stages or not path["recommended_resources"]:
        print(
            f"ATTENZIONE: il modello ha restituito sezioni vuote per '{path.get('role_name', '?')}': "
            f"stages vuoti={empty_stages}, risorse vuote={not path['recommended_resources']}"
        )

    return path

# --- Lingua -----------------------------------------------------------------

def _language_instruction(language: str) -> str:
    lang = (language or "en").lower()
    if lang in ["it", "italiano"]:
        return (
            "REGOLA OBBLIGATORIA PER L'ITALIANO: Scrivi TUTTI i valori di testo (sommari, nomi dei ruoli, spiegazioni dei percorsi, "
            "titoli delle azioni, dettagli, risorse) in un italiano fluente, naturale e professionale, utilizzato dai recruiter "
            "e career coach italiani. Evita traduzioni letterali o rigide. Suona nativo e professionale."
        )
    elif lang in ["es", "español", "spanish"]:
        return (
            "REGLA OBLIGATORIA PARA ESPAÑOL: Escribe TODOS los valores de texto en un español fluido, natural y profesional, "
            "utilizado por reclutadores y orientadores profesionales en España y América Latina. Evita traducciones literales."
        )
    return "MANDATORY RULE: You must write ALL text values strictly in professional English."

# --- Chiamata al modello con JSON mode + retry -------------------------------

def _call_model(prompt: str, models: list, max_tokens: int = 4096) -> dict:
    """Prova i modelli in ordine (il migliore per primo). Se un modello va in
    errore per quota/rate-limit/token esauriti, passa automaticamente al
    successivo della lista, invece di far fallire tutta la richiesta.
    Per ogni modello tenta anche un retry se il JSON risulta tagliato o
    non valido."""
    last_error = None
    for model in models:
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                )
            except Exception as e:
                # Errore dell'API (es. rate limit, quota, modello non disponibile):
                # non ha senso ritentare lo stesso modello, si passa al prossimo.
                print(f"MODELLO '{model}' non disponibile ({e}), provo il successivo...")
                last_error = e
                break

            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                json_match = re.search(r"\{[\s\S]*\}", content)
                if json_match:
                    try:
                        return json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        pass
            # JSON non valido: ritenta lo stesso modello una seconda volta
            # prima di passare a quello successivo.
    raise ValueError(f"Nessun modello disponibile ha prodotto JSON valido. Ultimo errore: {last_error}")

# --- Match analysis -----------------------------------------------------------

def analyze_match(cv_text: str, job_text: str, language: str = "en") -> dict:
    lang_rule = _language_instruction(language)

    prompt = f"""
{lang_rule}
You are an expert ATS and Senior Recruiter. Analyze the match between the CV and the Job Description.

Job Description:
{job_text}

CV:
{cv_text}

SCORING RULES (MANDATORY)

Evaluate the candidate using exactly these weights:

- technical_skills: 0-50 points
- nice_to_have: 0-20 points
- experience: 0-15 points
- soft_skills: 0-15 points

Rules:
- NEVER exceed the maximum points for any category.
- match_score MUST equal:
  technical_skills + nice_to_have + experience + soft_skills
- match_score MUST always be between 0 and 100.
- Be strict and evidence-based.
- Only award points when the CV explicitly demonstrates the required skills or experience.
- Missing required skills must reduce the score.

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

    try:
        data = _call_model(prompt, ANALYZE_MODELS, max_tokens=2048)

        sb = data.get("score_breakdown", {})

        technical = min(max(sb.get("technical_skills", 0), 0), 50)
        nice = min(max(sb.get("nice_to_have", 0), 0), 20)
        experience = min(max(sb.get("experience", 0), 0), 15)
        soft = min(max(sb.get("soft_skills", 0), 0), 15)

        data["score_breakdown"] = {
            "technical_skills": technical,
            "nice_to_have": nice,
            "experience": experience,
            "soft_skills": soft,
        }

        data["match_score"] = technical + nice + experience + soft

        # Contesto da riutilizzare nel Career Coach
        data["coach_context"] = {
            "match_score": data["match_score"],
            "score_breakdown": data["score_breakdown"],
            "matching_skills": data.get("matching_skills", [])[:15],
            "missing_skills": data.get("missing_skills", [])[:15],
            "summary": data.get("summary", "")[:400],
            "cv_suggestions": data.get("cv_suggestions", "")[:400],
            "interview_questions": data.get("interview_questions", [])[:4]
        }

        return data
    except Exception as e:
        print(f"ERRORE (analyze_match): {e}")
        return {
            "match_score": 0,
            "score_breakdown": {
                "technical_skills": 0,
                "nice_to_have": 0,
                "experience": 0,
                "soft_skills": 0
            },
            "matching_skills": [],
            "missing_skills": [],
            "summary": "Error parsing AI response.",
            "cv_suggestions": "Please try again.",
            "interview_questions": [],
            "coach_context": {}
        }
# --- Career coach (legacy single-path, mantenuto per compatibilità) ---------

def career_coach(cv_text: str, target_role: str = "", language: str = "en") -> dict:
    lang_rule = _language_instruction(language)

    prompt = f"""
{lang_rule}
You are an expert Career Coach and Senior Technical Recruiter. Analyze the user's CV and provide a career coaching report.
Target Role: {target_role if target_role else "General Career Progression"}

CV:
{cv_text}

For every resource and every action-plan item, DO NOT invent a URL. Instead give:
- "resource_provider": one of ["coursera", "udemy", "linkedin_learning", "freecodecamp", "youtube", "mdn"]
- "resource_query": a short, specific search phrase (2-6 words)

Return ONLY valid JSON with this exact structure:
{{
  "readiness_score": 0,
  "readiness_category": "",
  "target_role": "",
  "summary": "",
  "standout_angle": "",
  "action_plan": {{
    "thirty_days": [{{"action": "", "detail": "", "resource_provider": "", "resource_query": ""}}],
    "sixty_days": [{{"action": "", "detail": "", "resource_provider": "", "resource_query": ""}}],
    "ninety_days": [{{"action": "", "detail": "", "resource_provider": "", "resource_query": ""}}]
  }},
  "recommended_resources": [{{"title": "", "provider": "", "resource_query": ""}}]
}}
"""
    try:
        data = _call_model(prompt, COACH_MODELS, max_tokens=3000)
        return _postprocess_path(data)
    except Exception as e:
        print(f"ERRORE (career_coach): {e}")
        return _postprocess_path({
            "readiness_score": 50,
            "readiness_category": "Transitional",
            "target_role": target_role or "Developer",
            "summary": "Fallback summary due to parsing error.",
            "standout_angle": "Fallback angle.",
            "action_plan": {
                "thirty_days": [{"action": "Review skills", "detail": "Update profile."}],
                "sixty_days": [{"action": "Build projects", "detail": "Create apps."}],
                "ninety_days": [{"action": "Apply", "detail": "Send applications."}]
            },
            "recommended_resources": [{"title": "General Guide", "provider": "google", "resource_query": target_role or "career development"}]
        })

# --- Career coach multi-path (endpoint attivo /api/coach) -------------------
# --- Career coach multi-path (endpoint attivo /api/coach) -------------------

def career_coach_multi_path(coach_context: dict, target_role: str = "", language: str = "en") -> dict:
    lang_rule = _language_instruction(language)

    if target_role.strip():
        path_instruction = f"""
The candidate has explicitly requested an in-depth analysis for this SPECIFIC target role: "{target_role}".

You MUST return exactly 3 paths, but they must all be built around this request:
1. The FIRST path's "role_name" MUST be "{target_role}" (or the closest standard industry title for it),
   with a deep, specific readiness assessment against the actual requirements of that exact role —
   do not substitute it with a generic alternative.
2. The SECOND and THIRD paths should be the most realistic ADJACENT alternatives (e.g. a more senior/junior
   variant, or a closely related role) — genuinely useful backups, not unrelated generic paths.
Do not ignore "{target_role}" or replace it with a generic multi-path breakdown.
"""
    else:
        path_instruction = """
No specific target role was given. Identify the 3 most realistic career paths for this exact candidate,
based on their real skills and experience (they may combine technical and non-technical strengths —
do not force generic paths if they don't fit this candidate analysis).
"""

    prompt = f"""
{lang_rule}
You are an expert Career Coach and Senior Technical Recruiter. Analyze the candidate data deeply and evaluate it honestly
against the evidence provided in the candidate analysis (do not inflate seniority).

{path_instruction}

For EACH path, provide:
- "role_name": a specific, concrete job title (never a generic placeholder like "Career Path").
- A readiness score (0-100) based strictly on evidence in the candidate analysis, and a readiness_category translated naturally.
- "fit_explanation": 2-3 sentences on why this path fits, referencing specific things from the candidate analysis.
- A 30-60-90 day action plan where each action is CONCRETE and TARGETED to this candidate's actual gaps
  (not generic advice like "improve your skills" — name the specific skill, tool, or certification).
- Specific learning resources.

NON-NEGOTIABLE: "thirty_days", "sixty_days", and "ninety_days" must each contain AT LEAST 2 items, and
"recommended_resources" must contain AT LEAST 2 items, for EVERY path. An empty array in any of these
fields is not acceptable output — never skip or shorten them, even for the 2nd and 3rd path. Keep each
"detail" to one short sentence so you have enough room to fully populate every path.

For every resource and every action-plan item, DO NOT invent a URL. Instead give:
- "resource_provider": one of ["coursera", "udemy", "linkedin_learning", "freecodecamp", "youtube", "mdn"]
- "resource_query": a short, specific search phrase (2-6 words) that would surface a relevant real course

CRITICAL:
1. Return ONLY valid JSON, no markdown wrappers, no text outside the JSON object.
2. Every text value must follow the mandatory language rule above.

Candidate analysis:
{json.dumps(coach_context, indent=2)}

Use this exact JSON structure:
{{
  "candidate_overview": "",
  "paths": [
    {{
      "role_name": "",
      "readiness_score": 0,
      "readiness_category": "",
      "fit_explanation": "",
      "action_plan": {{
        "thirty_days": [{{ "action": "", "detail": "", "resource_provider": "", "resource_query": "" }}],
        "sixty_days": [{{ "action": "", "detail": "", "resource_provider": "", "resource_query": "" }}],
        "ninety_days": [{{ "action": "", "detail": "", "resource_provider": "", "resource_query": "" }}]
      }},
      "recommended_resources": [{{ "title": "", "provider": "", "resource_query": "" }}]
    }}
  ]
}}
"""
    try:
        data = _call_model(prompt, COACH_MODELS, max_tokens=8000)
        data["paths"] = [_postprocess_path(p) for p in data.get("paths", []) if isinstance(p, dict)]
        return data
    except Exception as e:
        print(f"ERRORE (career_coach_multi_path): {e}")
        return {
            "candidate_overview": "Error parsing multi-path analysis, displaying safe fallback.",
            "paths": [
                _postprocess_path({
                    "role_name": "Full Stack Web Developer",
                    "readiness_score": 60,
                    "readiness_category": "Transitional",
                    "fit_explanation": "Fallback profile description.",
                    "action_plan": {
                        "thirty_days": [{"action": "Review skills", "detail": "Update core web portfolio."}],
                        "sixty_days": [{"action": "Build projects", "detail": "Create full stack applications."}],
                        "ninety_days": [{"action": "Apply", "detail": "Send job applications."}]
                    },
                    "recommended_resources": [{"title": "Web Dev Guide", "provider": "freecodecamp", "resource_query": "full stack web development"}]
                })
            ]
        }