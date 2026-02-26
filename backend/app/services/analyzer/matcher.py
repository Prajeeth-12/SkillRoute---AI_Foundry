"""
Velocity-Based Matching Engine

Responsibilities:
  1. calculate_semantic_match() – compares resume vs JD skill sets and
     returns match_percentage, job_readiness_score, matched_skills, missing_skills.
  2. build_learning_velocity() – assigns Hours-To-Learn (HTL) to each missing
     skill, buckets them into two phases, and computes weeks_to_readiness.

HTL table (Hours-To-Learn by skill category):
  Language  → 40 h   (deepest investment)
  Framework → 30 h
  Cloud     → 20 h
  Database  → 15 h
  Tool      → 10 h   (fastest to pick up)
  Unknown   → 15 h   (safe default)
"""

from typing import Dict, List, Tuple
from .extractor import SkillExtractor

# ─── Hours-To-Learn table ─────────────────────────────────────────────────────

HTL_BY_CATEGORY: Dict[str, int] = {
    "language":  40,
    "framework": 30,
    "cloud":     20,
    "database":  15,
    "tool":      10,
}
DEFAULT_HTL = 15  # Fallback for unrecognised categories


# ─── Public functions ─────────────────────────────────────────────────────────

def calculate_semantic_match(
    resume_skills: List[str],
    jd_skills: List[str],
) -> Dict:
    """
    Compares two flat skill lists (both already normalised/lowercased).

    Returns:
        match_percentage    – % of JD skills covered by the resume
        job_readiness_score – weighted composite (match + breadth bonus)
        matched_skills      – skills present in both
        missing_skills      – JD skills absent from resume
    """
    resume_set = {s.lower().strip() for s in resume_skills}
    jd_set     = {s.lower().strip() for s in jd_skills}

    if not jd_set:
        return {
            "match_percentage":    0.0,
            "job_readiness_score": 0.0,
            "matched_skills":      [],
            "missing_skills":      [],
        }

    matched = sorted(resume_set & jd_set)
    missing = sorted(jd_set - resume_set)

    # Core match percentage (primary signal)
    match_pct = round(len(matched) / len(jd_set) * 100, 2)

    # Breadth bonus: candidate has additional adjacent skills (up to +30 pts)
    # Reflects that a wider skill set improves general job readiness.
    breadth_ratio = min(len(resume_set) / max(len(jd_set), 1), 1.5)
    breadth_bonus = round(min(breadth_ratio * 20, 30), 2)

    readiness = round(min(match_pct * 0.70 + breadth_bonus, 100.0), 2)

    return {
        "match_percentage":    match_pct,
        "job_readiness_score": readiness,
        "matched_skills":      matched,
        "missing_skills":      missing,
    }


def build_learning_velocity(
    missing_skills: List[str],
    extractor: SkillExtractor,
    hours_per_week: int,
) -> Dict:
    """
    Assigns HTL to each missing skill and organises them into two phases:

      Phase 1 – "Immediate Gaps"  : Tools & quick wins (HTL ≤ 20 h) → Week 1-2
      Phase 2 – "Advanced Mastery": Frameworks & languages (HTL > 20 h) → Week N+

    Returns the full learning_velocity object matching the output schema.
    """
    if not missing_skills:
        return {
            "total_estimated_hours": 0,
            "weeks_to_readiness":    0.0,
            "roadmap":               [],
        }

    # Tag every missing skill: (name, category, htl_hours)
    tagged: List[Tuple[str, str, int]] = []
    for skill in missing_skills:
        cat   = extractor.get_category(skill)
        hours = HTL_BY_CATEGORY.get(cat, DEFAULT_HTL)
        tagged.append((skill, cat, hours))

    # ── Split into phases ──────────────────────────────────────────────────
    phase1_items = [(s, c, h) for s, c, h in tagged if h <= 20]
    phase2_items = [(s, c, h) for s, c, h in tagged if h >  20]

    total_hours = sum(h for _, _, h in tagged)
    safe_hpw    = max(hours_per_week, 1)
    weeks_total = round(total_hours / safe_hpw, 1)

    roadmap: List[Dict] = []

    if phase1_items:
        p1_hours = sum(h for _, _, h in phase1_items)
        roadmap.append({
            "phase":           "Immediate Gaps",
            "skills":          [s for s, _, _ in phase1_items],
            "estimated_hours": p1_hours,
            "timeline":        "Week 1-2",
        })

    if phase2_items:
        p2_hours      = sum(h for _, _, h in phase2_items)
        p1_hours_used = sum(h for _, _, h in phase1_items) if phase1_items else 0
        p2_start_week = max(round(p1_hours_used / safe_hpw) + 1, 3)
        roadmap.append({
            "phase":           "Advanced Mastery",
            "skills":          [s for s, _, _ in phase2_items],
            "estimated_hours": p2_hours,
            "timeline":        f"Week {p2_start_week}+",
        })

    return {
        "total_estimated_hours": total_hours,
        "weeks_to_readiness":    weeks_total,
        "roadmap":               roadmap,
    }
