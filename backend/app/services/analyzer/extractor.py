"""
SkillExtractor – taxonomy-driven skill extraction from free-form text.

Strategy:
  1. Slide a 3→2→1 n-gram window over lowercased, cleaned text.
  2. Match against the SKILLS_TAXONOMY dict (and SKILL_ALIASES for common variations).
  3. Optionally enrich with spaCy noun-chunk candidates when 'en_core_web_sm' is available.
     Falls back gracefully to regex-only if spaCy or its model is missing.
"""

import re
from typing import Dict, List, Set

# ─── Skill Taxonomy ───────────────────────────────────────────────────────────
# Keys are categories; values are canonical lowercase skill names.

SKILLS_TAXONOMY: Dict[str, Set[str]] = {
    "language": {
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "dart",
        "perl", "bash", "shell", "powershell", "sql", "html", "css", "sass", "less",
        "objective-c", "groovy", "lua", "haskell", "erlang", "elixir", "clojure",
        "f#", "cobol", "fortran", "solidity", "assembly",
    },
    "framework": {
        # Frontend
        "react", "angular", "vue", "svelte", "nextjs", "nuxtjs", "gatsby",
        "remix", "astro", "react native", "flutter", "ionic", "electron",
        # Backend
        "django", "flask", "fastapi", "spring", "spring boot", "express", "nestjs",
        "koa", "hapi", "laravel", "rails", "ruby on rails", "asp.net", ".net core",
        "blazor", "quarkus", "micronaut", "ktor",
        # ML / Data Science
        "pytorch", "tensorflow", "keras", "jax", "scikit-learn", "xgboost",
        "lightgbm", "catboost", "huggingface", "transformers", "langchain",
        "llamaindex", "pandas", "numpy", "scipy", "matplotlib", "seaborn",
        "plotly", "bokeh", "streamlit", "gradio",
        # CSS / UI
        "bootstrap", "tailwind", "material ui", "chakra ui", "ant design", "shadcn",
        # State / API
        "redux", "zustand", "mobx", "graphql", "apollo", "trpc",
        # ORM / DB adapters
        "sqlalchemy", "alembic", "prisma", "mongoose", "typeorm", "hibernate",
        # Testing
        "junit", "pytest", "jest", "vitest", "cypress", "playwright", "selenium",
        "mocha", "chai", "storybook",
        # Async / Messaging
        "celery", "grpc", "opentelemetry",
    },
    "tool": {
        # Version control
        "git", "github", "gitlab", "bitbucket",
        # Containers / Orchestration
        "docker", "kubernetes", "k8s", "helm",
        # CI/CD
        "jenkins", "github actions", "circleci", "travis ci", "teamcity",
        "argocd", "flux",
        # IaC / Config management
        "terraform", "pulumi", "ansible", "puppet", "chef", "vagrant",
        # Web servers
        "nginx", "apache",
        # OS
        "linux", "ubuntu", "centos", "debian",
        # Project management / Design
        "jira", "confluence", "notion", "figma",
        # API tooling
        "postman", "swagger", "openapi",
        # Bundlers / Linters
        "webpack", "vite", "babel", "eslint", "prettier",
        # Observability
        "sonarqube", "sentry", "grafana", "prometheus", "datadog", "splunk",
        "elasticsearch", "logstash", "kibana", "new relic",
        # Data / ML ops
        "airflow", "dbt", "mlflow", "wandb", "dvc", "ray",
        # Messaging
        "kafka", "rabbitmq", "nats", "socket.io", "websockets",
        # Auth / Security
        "oauth", "jwt", "keycloak", "vault",
        # Service mesh
        "istio", "envoy", "linkerd",
    },
    "database": {
        "mysql", "postgresql", "postgres", "sqlite", "mongodb", "cassandra",
        "couchdb", "dynamodb", "firestore", "firebase", "oracle", "mssql",
        "sql server", "mariadb", "neo4j", "influxdb", "clickhouse", "snowflake",
        "bigquery", "hive", "redis",
        # Vector DBs
        "pinecone", "weaviate", "chroma", "qdrant",
        # Managed / BaaS
        "supabase", "planetscale", "neon", "fauna",
    },
    "cloud": {
        # Providers
        "aws", "azure", "gcp", "google cloud", "heroku", "digitalocean",
        "vercel", "netlify", "cloudflare", "linode", "vultr",
        # AWS services
        "ec2", "s3", "lambda", "rds", "eks", "ecs", "fargate", "sqs", "sns",
        "api gateway", "amplify",
        # Azure services
        "azure functions", "azure devops", "azure aks",
        # GCP services
        "cloud run", "app engine", "gke", "cloud functions", "firebase hosting",
    },
}

# ─── Aliases (all lowercase) ──────────────────────────────────────────────────
# Maps common text variants → canonical taxonomy name.

SKILL_ALIASES: Dict[str, str] = {
    # JavaScript ecosystem
    "react.js": "react",       "reactjs": "react",       "react js": "react",
    "vue.js": "vue",           "vuejs": "vue",            "vue js": "vue",
    "next.js": "nextjs",       "next js": "nextjs",
    "nuxt.js": "nuxtjs",       "nuxt js": "nuxtjs",
    "nest.js": "nestjs",       "nestjs": "nestjs",
    "node.js": "nodejs",       "nodejs": "nodejs",        "node js": "nodejs",
    "express.js": "express",   "expressjs": "express",
    # Python / ML
    "scikit learn": "scikit-learn",  "sklearn": "scikit-learn",
    "tf": "tensorflow",
    "torch": "pytorch",
    # Databases
    "postgres": "postgresql",  "pg": "postgresql",
    "mongo": "mongodb",        "mongo db": "mongodb",
    "ms sql": "mssql",         "microsoft sql server": "sql server",
    # Cloud shorthands
    "amazon web services": "aws",
    "google cloud platform": "gcp",
    "microsoft azure": "azure",
    # Kubernetes
    "k8s": "kubernetes",
    # Languages
    "js": "javascript",        "ts": "typescript",
    "py": "python",
    "c sharp": "c#",           "c plus plus": "c++",
    # CSS
    "tailwindcss": "tailwind", "tailwind css": "tailwind",
    "material-ui": "material ui", "mui": "material ui",
    # DevOps
    "gh actions": "github actions",
    "ci cd": "ci/cd",          "cicd": "ci/cd",
    # REST
    "rest api": "rest",        "restful": "rest",         "rest apis": "rest",
    # Spring
    "spring-boot": "spring boot",
}

# ─── Flat lookup: skill_name → category ──────────────────────────────────────
_SKILL_TO_CATEGORY: Dict[str, str] = {
    skill: cat
    for cat, skill_set in SKILLS_TAXONOMY.items()
    for skill in skill_set
}


# ─── SkillExtractor ───────────────────────────────────────────────────────────

class SkillExtractor:
    """
    Extracts technical skills from free-form text and returns them
    as a categorised dict or a flat list.
    """

    _NLP = None  # Lazy-loaded spaCy model; False if unavailable.

    # ── Public API ────────────────────────────────────────────────────────────

    def extract(self, text: str) -> Dict[str, List[str]]:
        """
        Returns { category: [skill, ...] } for all detected skills.
        """
        found = self._keyword_match(text)
        nlp = self._load_spacy()
        if nlp:
            found = self._enrich_with_spacy(text, nlp, found)

        categorised: Dict[str, List[str]] = {}
        for skill in found:
            cat = self.get_category(skill)
            bucket = categorised.setdefault(cat, [])
            if skill not in bucket:
                bucket.append(skill)

        # Sort each bucket for deterministic output
        for cat in categorised:
            categorised[cat].sort()

        return categorised

    def extract_flat(self, text: str) -> List[str]:
        """Returns a flat, sorted, de-duplicated list of detected skill names."""
        all_skills: Set[str] = set()
        for skills in self.extract(text).values():
            all_skills.update(skills)
        return sorted(all_skills)

    def get_category(self, skill: str) -> str:
        """Returns the taxonomy category for a skill name; defaults to 'tool'."""
        return _SKILL_TO_CATEGORY.get(self._normalize(skill), "tool")

    # ── Internals ─────────────────────────────────────────────────────────────

    @staticmethod
    def _normalize(skill: str) -> str:
        s = skill.lower().strip()
        return SKILL_ALIASES.get(s, s)

    def _keyword_match(self, text: str) -> Set[str]:
        """
        Greedy n-gram scan (trigram → bigram → unigram) over cleaned text.
        Longer phrases are preferred so "spring boot" beats "spring" + "boot".
        """
        # Keep alphanumeric, whitespace, and skill-relevant punctuation
        clean = re.sub(r"[^\w\s\.#\+\-/]", " ", text.lower())
        clean = re.sub(r"\s+", " ", clean).strip()
        tokens = clean.split()

        found: Set[str] = set()
        n = len(tokens)
        # Track consumed positions to avoid double-counting sub-phrases
        consumed: Set[int] = set()

        for size in (3, 2, 1):
            for i in range(n - size + 1):
                if any(j in consumed for j in range(i, i + size)):
                    continue
                phrase = " ".join(tokens[i: i + size])
                norm = self._normalize(phrase)
                if norm in _SKILL_TO_CATEGORY:
                    found.add(norm)
                    consumed.update(range(i, i + size))

        return found

    @classmethod
    def _load_spacy(cls):
        """Lazy-loads spaCy en_core_web_sm; returns False if unavailable."""
        if cls._NLP is not None:
            return cls._NLP if cls._NLP is not False else None

        try:
            import spacy
            try:
                cls._NLP = spacy.load("en_core_web_sm")
            except OSError:
                # Model not downloaded – fall back to blank English pipeline
                cls._NLP = spacy.blank("en")
        except ImportError:
            cls._NLP = False

        return cls._NLP if cls._NLP is not False else None

    @staticmethod
    def _enrich_with_spacy(text: str, nlp, existing: Set[str]) -> Set[str]:
        """
        Passes text through spaCy and checks noun chunks against the taxonomy.
        Adds any matches not already found via keyword scan.
        """
        doc = nlp(text[:50_000])  # Cap to avoid memory spikes on large docs
        for chunk in doc.noun_chunks:
            candidate = chunk.text.lower().strip()
            # Try full chunk, then its head word
            for probe in (candidate, chunk.root.text.lower()):
                norm = SKILL_ALIASES.get(probe, probe)
                if norm in _SKILL_TO_CATEGORY:
                    existing.add(norm)
                    break
        return existing
