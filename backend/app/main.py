import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from app.routes.analysis import router as analysis_router

load_dotenv()

app = FastAPI(
    title="CVMatch AI",
    description="AI-powered job match analyzer — open source, multilingual",
    version="1.0.0"
)

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTA: /api/analyze e /api/coach vivono entrambi in analysis.py.
# Il vecchio routes/coach.py duplicava /api/coach senza inoltrare
# target_role: è stato rimosso per evitare che tornasse silenziosamente
# a essere quello attivo in caso di riordino degli include.
app.include_router(analysis_router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}

# Serve the built frontend (run `npm run build` in /frontend first) so the
# whole app — API + UI — can run and deploy as a single service.
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "CVMatch AI backend is running 🚀 (frontend not built yet — see README)"}