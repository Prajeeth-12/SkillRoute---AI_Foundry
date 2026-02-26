"""
POST /api/v1/analyze-gap

Accepts a resume file (PDF / DOCX / TXT) + job-description text and returns
a skill-gap analysis with a velocity-based learning roadmap.

Processing pipeline
───────────────────
1. Parse resume bytes → plain text  (in-memory, no disk I/O)
2. Extract skills from resume & JD  (CPU-bound → runs in thread pool)
3. Calculate semantic match score
4. Build learning-velocity roadmap
5. Return full JSON response immediately
6. Persist result to Firestore       (BackgroundTask – non-blocking)
"""

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from typing import List, Tuple

from app.utils.auth import verify_firebase_token
from app.services.analyzer.parser import extract_text_from_file
from app.services.analyzer.extractor import SkillExtractor
from app.services.analyzer.matcher import calculate_semantic_match, build_learning_velocity
from app.services.analyzer.storage import save_gap_analysis

router = APIRouter(prefix="/api/v1", tags=["Skill Gap Analyzer"])


# ─── Response Schema ──────────────────────────────────────────────────────────

class RoadmapPhase(BaseModel):
    phase:           str
    skills:          List[str]
    estimated_hours: int
    timeline:        str


class LearningVelocity(BaseModel):
    total_estimated_hours: int
    weeks_to_readiness:    float
    roadmap:               List[RoadmapPhase]


class GapAnalysisResponse(BaseModel):
    match_percentage:    float = Field(..., example=62.5)
    job_readiness_score: float = Field(..., example=73.0)
    matched_skills:      List[str]
    missing_skills:      List[str]
    learning_velocity:   LearningVelocity


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post(
    "/analyze-gap",
    response_model=GapAnalysisResponse,
    summary="Adaptive Skill Gap Analyzer",
    description=(
        "Upload a resume (PDF/DOCX/TXT) and paste a job description. "
        "Receive a match score, skill gaps, and a personalised learning roadmap "
        "calibrated to your available hours per week."
    ),
)
async def analyze_skill_gap(
    background_tasks: BackgroundTasks,
    # ── Form inputs (multipart/form-data – required when mixing UploadFile + fields)
    resume_file:    UploadFile = File(...,      description="Resume in PDF, DOCX, or TXT format"),
    jd_text:        str        = Form(...,      description="Full job description text"),
    hours_per_week: int        = Form(default=10, ge=1, le=80,
                                       description="Study hours available per week"),
    # ── Auth: extracts user_id from Bearer token (no Firebase Storage needed)
    user_id: str = Depends(verify_firebase_token),
):
    # ── 1. Validate inputs ────────────────────────────────────────────────────
    if not jd_text.strip():
        raise HTTPException(status_code=422, detail="jd_text must not be empty.")

    # ── 2. Parse resume in-memory (async I/O read + sync CPU parse) ───────────
    resume_text = await extract_text_from_file(resume_file)
    if not resume_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the resume file. "
                   "Ensure the PDF/DOCX is not image-only or password-protected.",
        )

    # ── 3. Extract skills (CPU-bound NLP → thread pool, keeps event loop free) ─
    extractor = SkillExtractor()
    resume_skills, jd_skills = await run_in_threadpool(
        _extract_skills_sync, extractor, resume_text, jd_text
    )

    if not jd_skills:
        raise HTTPException(
            status_code=422,
            detail="No recognisable technical skills found in the job description. "
                   "Please provide a more detailed JD.",
        )

    # ── 4. Semantic match ─────────────────────────────────────────────────────
    match_result = calculate_semantic_match(resume_skills, jd_skills)

    # ── 5. Velocity-based learning roadmap ────────────────────────────────────
    velocity = build_learning_velocity(
        missing_skills=match_result["missing_skills"],
        extractor=extractor,
        hours_per_week=hours_per_week,
    )

    # ── 6. Compose response ───────────────────────────────────────────────────
    response_payload = {
        "match_percentage":    match_result["match_percentage"],
        "job_readiness_score": match_result["job_readiness_score"],
        "matched_skills":      match_result["matched_skills"],
        "missing_skills":      match_result["missing_skills"],
        "learning_velocity":   velocity,
    }

    # ── 7. Persist to Firestore asynchronously (non-blocking BackgroundTask) ──
    background_tasks.add_task(save_gap_analysis, user_id, response_payload)

    return response_payload


# ─── Thread-pool helper ───────────────────────────────────────────────────────
# Defined at module level (not as a closure) so it is safely picklable.

def _extract_skills_sync(
    extractor: SkillExtractor,
    resume_text: str,
    jd_text: str,
) -> Tuple[List[str], List[str]]:
    """Runs synchronous NLP extraction for both texts in a single thread call."""
    resume_skills = extractor.extract_flat(resume_text)
    jd_skills     = extractor.extract_flat(jd_text)
    return resume_skills, jd_skills
