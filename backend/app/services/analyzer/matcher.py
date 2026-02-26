"""
Velocity-Based Matching Engine

Responsibilities:
  1. calculate_semantic_match() – compares resume vs JD skill sets and
     returns match_percentage, job_readiness_score, matched_skills, missing_skills.
  2. build_learning_velocity() – assigns Hours-To-Learn (HTL) to each missing
     skill, buckets them into two phases, and computes weeks_to_readiness.
  3. get_skill_resources() – returns curated free learning resources per skill.

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

# ─── Curated free resources per skill ────────────────────────────────────────
# Format: skill_name_lowercase → list of {title, url, type, duration}
SKILL_RESOURCES: Dict[str, List[Dict]] = {
    # ── Languages ──────────────────────────────────────────────────────────
    "python": [
        {"title": "Python Official Tutorial", "url": "https://docs.python.org/3/tutorial/", "type": "docs", "duration": "8h"},
        {"title": "CS50P – Harvard Python", "url": "https://cs50.harvard.edu/python/", "type": "course", "duration": "20h"},
        {"title": "Real Python – Beginner Guides", "url": "https://realpython.com/start-here/", "type": "article", "duration": "5h"},
    ],
    "javascript": [
        {"title": "javascript.info – Modern JS", "url": "https://javascript.info/", "type": "docs", "duration": "20h"},
        {"title": "freeCodeCamp JS Algorithms", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "type": "course", "duration": "30h"},
    ],
    "typescript": [
        {"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/handbook/", "type": "docs", "duration": "8h"},
        {"title": "Matt Pocock – Total TypeScript (free)", "url": "https://www.totaltypescript.com/tutorials", "type": "course", "duration": "6h"},
    ],
    "java": [
        {"title": "Oracle Java Tutorials", "url": "https://docs.oracle.com/javase/tutorial/", "type": "docs", "duration": "15h"},
        {"title": "Codecademy Learn Java", "url": "https://www.codecademy.com/learn/learn-java", "type": "course", "duration": "12h"},
    ],
    "go": [
        {"title": "Tour of Go", "url": "https://go.dev/tour/", "type": "docs", "duration": "5h"},
        {"title": "Go by Example", "url": "https://gobyexample.com/", "type": "article", "duration": "6h"},
    ],
    "rust": [
        {"title": "The Rust Book", "url": "https://doc.rust-lang.org/book/", "type": "docs", "duration": "20h"},
        {"title": "Rustlings Exercises", "url": "https://github.com/rust-lang/rustlings", "type": "project", "duration": "8h"},
    ],
    "c++": [
        {"title": "learncpp.com", "url": "https://www.learncpp.com/", "type": "article", "duration": "20h"},
        {"title": "cppreference.com", "url": "https://en.cppreference.com/", "type": "docs", "duration": "5h"},
    ],
    "c#": [
        {"title": "Microsoft C# Docs", "url": "https://learn.microsoft.com/en-us/dotnet/csharp/", "type": "docs", "duration": "10h"},
        {"title": "C# Fundamentals – freeCodeCamp YT", "url": "https://www.youtube.com/watch?v=GhQdlIFylQ8", "type": "video", "duration": "4h"},
    ],
    "swift": [
        {"title": "Swift.org – A Swift Tour", "url": "https://docs.swift.org/swift-book/documentation/the-swift-programming-language/guidedtour/", "type": "docs", "duration": "6h"},
        {"title": "Hacking with Swift", "url": "https://www.hackingwithswift.com/", "type": "article", "duration": "15h"},
    ],
    "kotlin": [
        {"title": "Kotlin Koans", "url": "https://kotlinlang.org/docs/koans.html", "type": "project", "duration": "5h"},
        {"title": "Kotlin Docs", "url": "https://kotlinlang.org/docs/home.html", "type": "docs", "duration": "8h"},
    ],
    # ── Frameworks / Libraries ──────────────────────────────────────────────
    "react": [
        {"title": "React Official Docs (beta)", "url": "https://react.dev/learn", "type": "docs", "duration": "10h"},
        {"title": "Full Modern React – Scrimba", "url": "https://scrimba.com/learn/learnreact", "type": "course", "duration": "12h"},
    ],
    "vue": [
        {"title": "Vue 3 Official Guide", "url": "https://vuejs.org/guide/introduction.html", "type": "docs", "duration": "8h"},
        {"title": "Vue Mastery – Intro to Vue", "url": "https://www.vuemastery.com/courses/intro-to-vue-3/", "type": "course", "duration": "4h"},
    ],
    "angular": [
        {"title": "Angular Official Docs", "url": "https://angular.dev/overview", "type": "docs", "duration": "12h"},
        {"title": "Angular Crash Course – Traversy Media", "url": "https://www.youtube.com/watch?v=3dHNOWTI7H8", "type": "video", "duration": "2h"},
    ],
    "fastapi": [
        {"title": "FastAPI Official Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/", "type": "docs", "duration": "6h"},
        {"title": "FastAPI Crash Course – YT", "url": "https://www.youtube.com/watch?v=7t2alSnE2-I", "type": "video", "duration": "1h"},
    ],
    "django": [
        {"title": "Django Official Tutorial", "url": "https://docs.djangoproject.com/en/5.0/intro/tutorial01/", "type": "docs", "duration": "8h"},
        {"title": "Django for Beginners – freeCodeCamp", "url": "https://www.youtube.com/watch?v=F5mRW0jo-U4", "type": "video", "duration": "4h"},
    ],
    "flask": [
        {"title": "Flask Mega-Tutorial", "url": "https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world", "type": "article", "duration": "10h"},
        {"title": "Flask Quickstart", "url": "https://flask.palletsprojects.com/en/3.0.x/quickstart/", "type": "docs", "duration": "2h"},
    ],
    "spring boot": [
        {"title": "Spring Boot – Official Guides", "url": "https://spring.io/guides", "type": "docs", "duration": "8h"},
        {"title": "Spring Boot Tutorial – Amigoscode", "url": "https://www.youtube.com/watch?v=9SGDpanrc8U", "type": "video", "duration": "3h"},
    ],
    "pytorch": [
        {"title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/", "type": "docs", "duration": "10h"},
        {"title": "Deep Learning with PyTorch – freeCodeCamp", "url": "https://www.youtube.com/watch?v=GIsg-ZUy0MY", "type": "video", "duration": "10h"},
    ],
    "tensorflow": [
        {"title": "TensorFlow Tutorials", "url": "https://www.tensorflow.org/tutorials", "type": "docs", "duration": "10h"},
        {"title": "TF for Beginners – Google Dev", "url": "https://developers.google.com/machine-learning/crash-course", "type": "course", "duration": "15h"},
    ],
    "scikit-learn": [
        {"title": "Scikit-learn User Guide", "url": "https://scikit-learn.org/stable/user_guide.html", "type": "docs", "duration": "8h"},
        {"title": "ML with Scikit-Learn – YT", "url": "https://www.youtube.com/watch?v=0B5eIE_1vpU", "type": "video", "duration": "6h"},
    ],
    "unity": [
        {"title": "Unity Learn – Official Courses", "url": "https://learn.unity.com/", "type": "course", "duration": "20h"},
        {"title": "Unity Beginner to Pro – Brackeys YT", "url": "https://www.youtube.com/c/Brackeys", "type": "video", "duration": "10h"},
    ],
    "unreal engine": [
        {"title": "Unreal Online Learning", "url": "https://dev.epicgames.com/community/unreal-engine/getting-started/games", "type": "course", "duration": "20h"},
        {"title": "UE5 Beginners Series – YT", "url": "https://www.youtube.com/watch?v=k-zMkzmduqI", "type": "video", "duration": "4h"},
    ],
    # ── Tools / DevOps ─────────────────────────────────────────────────────
    "docker": [
        {"title": "Docker Official Get Started", "url": "https://docs.docker.com/get-started/", "type": "docs", "duration": "4h"},
        {"title": "Docker Tutorial – TechWorld with Nana", "url": "https://www.youtube.com/watch?v=3c-iBn73dDE", "type": "video", "duration": "4h"},
    ],
    "kubernetes": [
        {"title": "Kubernetes Official Basics", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "type": "docs", "duration": "6h"},
        {"title": "Kubernetes Course – TechWorld with Nana", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "type": "video", "duration": "4h"},
    ],
    "git": [
        {"title": "Pro Git Book (free)", "url": "https://git-scm.com/book/en/v2", "type": "docs", "duration": "5h"},
        {"title": "Git & GitHub Crash Course – Traversy", "url": "https://www.youtube.com/watch?v=SWYqp7iY_Tc", "type": "video", "duration": "1h"},
    ],
    "jenkins": [
        {"title": "Jenkins Official Docs", "url": "https://www.jenkins.io/doc/", "type": "docs", "duration": "5h"},
        {"title": "Jenkins CI/CD – TechWorld with Nana", "url": "https://www.youtube.com/watch?v=6YZvp2GwT0A", "type": "video", "duration": "2h"},
    ],
    "gitlab": [
        {"title": "GitLab CI/CD Docs", "url": "https://docs.gitlab.com/ee/ci/", "type": "docs", "duration": "4h"},
        {"title": "GitLab CI Tutorial – YT", "url": "https://www.youtube.com/watch?v=qP8kir2GUgo", "type": "video", "duration": "1h"},
    ],
    "terraform": [
        {"title": "HashiCorp Learn – Terraform", "url": "https://developer.hashicorp.com/terraform/tutorials", "type": "course", "duration": "6h"},
        {"title": "Terraform Crash Course – FCC YT", "url": "https://www.youtube.com/watch?v=SLB_c_ayRMo", "type": "video", "duration": "2h"},
    ],
    "ansible": [
        {"title": "Ansible Docs – Getting Started", "url": "https://docs.ansible.com/ansible/latest/getting_started/index.html", "type": "docs", "duration": "4h"},
        {"title": "Ansible Full Course – TechWorld Nana", "url": "https://www.youtube.com/watch?v=1id6ERvfozo", "type": "video", "duration": "2h"},
    ],
    "linux": [
        {"title": "Linux Journey", "url": "https://linuxjourney.com/", "type": "course", "duration": "8h"},
        {"title": "The Linux Command Line (free book)", "url": "https://linuxcommand.org/tlcl.php", "type": "docs", "duration": "10h"},
    ],
    "bash": [
        {"title": "Bash Scripting Tutorial", "url": "https://www.shellscript.sh/", "type": "article", "duration": "4h"},
        {"title": "Bash Scripting – freeCodeCamp", "url": "https://www.youtube.com/watch?v=e7BufAVwDiM", "type": "video", "duration": "3h"},
    ],
    # ── Databases ─────────────────────────────────────────────────────────
    "postgresql": [
        {"title": "PostgreSQL Official Tutorial", "url": "https://www.postgresql.org/docs/current/tutorial.html", "type": "docs", "duration": "6h"},
        {"title": "PostgreSQL Tutorial", "url": "https://www.postgresqltutorial.com/", "type": "article", "duration": "5h"},
    ],
    "mysql": [
        {"title": "MySQL 8 Reference Manual", "url": "https://dev.mysql.com/doc/refman/8.0/en/", "type": "docs", "duration": "5h"},
        {"title": "MySQL Crash Course – Traversy YT", "url": "https://www.youtube.com/watch?v=9ylj9NR0Lcg", "type": "video", "duration": "1h"},
    ],
    "mongodb": [
        {"title": "MongoDB University (free)", "url": "https://learn.mongodb.com/", "type": "course", "duration": "8h"},
        {"title": "MongoDB Crash Course – Traversy", "url": "https://www.youtube.com/watch?v=-56x56UppqQ", "type": "video", "duration": "1h"},
    ],
    "redis": [
        {"title": "Redis University (free)", "url": "https://university.redis.com/", "type": "course", "duration": "4h"},
        {"title": "Redis Crash Course – Traversy", "url": "https://www.youtube.com/watch?v=jgpVdJB2sKQ", "type": "video", "duration": "1h"},
    ],
    "sql": [
        {"title": "SQLZoo", "url": "https://sqlzoo.net/", "type": "course", "duration": "5h"},
        {"title": "Mode SQL Tutorial", "url": "https://mode.com/sql-tutorial/", "type": "article", "duration": "3h"},
    ],
    # ── Cloud ──────────────────────────────────────────────────────────────
    "aws": [
        {"title": "AWS Skill Builder (free tier)", "url": "https://skillbuilder.aws/", "type": "course", "duration": "10h"},
        {"title": "AWS Cloud Practitioner Essentials", "url": "https://explore.skillbuilder.aws/learn/course/134/aws-cloud-practitioner-essentials", "type": "course", "duration": "6h"},
    ],
    "gcp": [
        {"title": "Google Cloud Skills Boost (free)", "url": "https://www.cloudskillsboost.google/", "type": "course", "duration": "10h"},
        {"title": "GCP Fundamentals – Coursera (audit)", "url": "https://www.coursera.org/learn/gcp-fundamentals", "type": "course", "duration": "8h"},
    ],
    "azure": [
        {"title": "Microsoft Learn – Azure", "url": "https://learn.microsoft.com/en-us/training/azure/", "type": "course", "duration": "10h"},
        {"title": "AZ-900 Study Guide", "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/", "type": "docs", "duration": "5h"},
    ],
    "helm": [
        {"title": "Helm Docs", "url": "https://helm.sh/docs/", "type": "docs", "duration": "3h"},
        {"title": "Helm Tutorial – TechWorld Nana YT", "url": "https://www.youtube.com/watch?v=-ykwb1d0DXU", "type": "video", "duration": "1h"},
    ],
    "prometheus": [
        {"title": "Prometheus Docs", "url": "https://prometheus.io/docs/introduction/overview/", "type": "docs", "duration": "3h"},
        {"title": "Prometheus & Grafana Tutorial – YT", "url": "https://www.youtube.com/watch?v=h4Sl21AKiDg", "type": "video", "duration": "2h"},
    ],
    "grafana": [
        {"title": "Grafana Tutorials", "url": "https://grafana.com/tutorials/", "type": "course", "duration": "3h"},
        {"title": "Grafana Full Course – YT", "url": "https://www.youtube.com/watch?v=CjABEnRvl0Y", "type": "video", "duration": "2h"},
    ],
    "hibernate": [
        {"title": "Hibernate ORM Docs", "url": "https://hibernate.org/orm/documentation/", "type": "docs", "duration": "5h"},
        {"title": "Hibernate Tutorial – Telusko YT", "url": "https://www.youtube.com/watch?v=JR7-EdxDSf0", "type": "video", "duration": "3h"},
    ],
    "spring": [
        {"title": "Spring Framework Docs", "url": "https://spring.io/projects/spring-framework#learn", "type": "docs", "duration": "8h"},
        {"title": "Spring Boot Full Course – FCC YT", "url": "https://www.youtube.com/watch?v=9SGDpanrc8U", "type": "video", "duration": "3h"},
    ],
    "pandas": [
        {"title": "10 minutes to pandas", "url": "https://pandas.pydata.org/docs/user_guide/10min.html", "type": "docs", "duration": "2h"},
        {"title": "Pandas Tutorial – Corey Schafer YT", "url": "https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS", "type": "video", "duration": "6h"},
    ],
    "numpy": [
        {"title": "NumPy Official Tutorial", "url": "https://numpy.org/doc/stable/user/absolute_beginners.html", "type": "docs", "duration": "3h"},
        {"title": "NumPy Full Course – FCC YT", "url": "https://www.youtube.com/watch?v=QUT1VHiLmmI", "type": "video", "duration": "1h"},
    ],
    "tailwind": [
        {"title": "Tailwind CSS Official Docs", "url": "https://tailwindcss.com/docs", "type": "docs", "duration": "3h"},
        {"title": "Tailwind CSS Crash Course – Traversy", "url": "https://www.youtube.com/watch?v=dFgzHOX84xQ", "type": "video", "duration": "1h"},
    ],
}

DEFAULT_RESOURCES = [
    {"title": "Search on freeCodeCamp", "url": "https://www.freecodecamp.org/news/search/?query={skill}", "type": "article", "duration": "varies"},
    {"title": "YouTube tutorials", "url": "https://www.youtube.com/results?search_query={skill}+tutorial", "type": "video", "duration": "varies"},
]


def get_skill_resources(skill: str) -> List[Dict]:
    """Return curated resources for a skill, falling back to search links."""
    key = skill.lower().strip()
    if key in SKILL_RESOURCES:
        return SKILL_RESOURCES[key]
    # Generic fallback
    return [
        {"title": f"freeCodeCamp – {skill}", "url": f"https://www.freecodecamp.org/news/search/?query={skill.replace(' ', '+')}", "type": "article", "duration": "varies"},
        {"title": f"YouTube – {skill} tutorial", "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial+for+beginners", "type": "video", "duration": "varies"},
    ]

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

    def _build_skill_entries(items: List[Tuple]) -> List[Dict]:
        """Convert tagged skills into enriched dicts with resources."""
        entries = []
        for skill, cat, htl in items:
            entries.append({
                "name":      skill,
                "category":  cat,
                "hours":     htl,
                "resources": get_skill_resources(skill),
            })
        return entries

    roadmap: List[Dict] = []

    if phase1_items:
        p1_hours = sum(h for _, _, h in phase1_items)
        p1_weeks = max(round(p1_hours / safe_hpw), 1)
        roadmap.append({
            "phase":           "Immediate Gaps",
            "skills":          [s for s, _, _ in phase1_items],
            "skill_details":   _build_skill_entries(phase1_items),
            "estimated_hours": p1_hours,
            "timeline":        f"Week 1–{p1_weeks}" if p1_weeks > 1 else "Week 1",
        })

    if phase2_items:
        p2_hours      = sum(h for _, _, h in phase2_items)
        p1_hours_used = sum(h for _, _, h in phase1_items) if phase1_items else 0
        p2_start_week = max(round(p1_hours_used / safe_hpw) + 1, 3)
        p2_end_week   = max(round(total_hours / safe_hpw), p2_start_week + 1)
        roadmap.append({
            "phase":           "Advanced Mastery",
            "skills":          [s for s, _, _ in phase2_items],
            "skill_details":   _build_skill_entries(phase2_items),
            "estimated_hours": p2_hours,
            "timeline":        f"Week {p2_start_week}–{p2_end_week}",
        })

    return {
        "total_estimated_hours": total_hours,
        "weeks_to_readiness":    weeks_total,
        "roadmap":               roadmap,
    }
