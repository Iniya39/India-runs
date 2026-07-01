import logging
import re

from app.schemas.ranking import Candidate, RankingRequest, RankedCandidate
from app.services.similarity import similarity_service

logger = logging.getLogger("ai_service")

DEFAULT_RANKING_WEIGHTS: dict[str, float] = {
    "semantic_similarity": 0.45,
    "skills_match": 0.20,
    "project_relevance": 0.15,
    "experience_match": 0.10,
    "certification_score": 0.05,
    "education_score": 0.05,
}

_SCORE_COMPONENTS = tuple(DEFAULT_RANKING_WEIGHTS.keys())

_EXPLANATION_TIERS: dict[str, tuple[tuple[float, str], ...]] = {
    "semantic_similarity": (
        (80.0, "excellent semantic alignment"),
        (60.0, "good semantic alignment"),
    ),
    "skills_match": (
        (75.0, "strong skill overlap"),
        (50.0, "partial skill overlap"),
    ),
    "project_relevance": (
        (75.0, "relevant project experience"),
        (50.0, "some project relevance"),
    ),
    "experience_match": (
        (75.0, "appropriate experience"),
        (50.0, "reasonable experience fit"),
    ),
    "certification_score": (
        (60.0, "valuable certifications"),
        (30.0, "supporting certifications"),
    ),
    "education_score": (
        (60.0, "strong educational background"),
        (30.0, "relevant education"),
    ),
}

_ENTRY_LEVEL_KEYWORDS = (
    "entry level",
    "entry-level",
    "junior",
    "graduate",
    "intern",
    "fresher",
    "0-1 years",
    "0-2 years",
    "no experience required",
)

_DEGREE_KEYWORDS = (
    "bachelor",
    "b.tech",
    "b.e.",
    "bsc",
    "bs ",
    "master",
    "m.tech",
    "msc",
    "mba",
    "phd",
    "doctorate",
    "computer science",
    "engineering",
    "information technology",
)

_STOPWORDS = frozenset(
    {
        "a",
        "an",
        "the",
        "and",
        "or",
        "for",
        "with",
        "in",
        "on",
        "at",
        "to",
        "of",
        "is",
        "are",
        "be",
        "as",
        "by",
        "we",
        "you",
        "our",
        "will",
        "must",
        "have",
        "has",
        "this",
        "that",
        "from",
        "your",
        "their",
        "who",
        "can",
        "able",
        "using",
        "use",
        "work",
        "working",
        "role",
        "job",
        "team",
        "years",
        "year",
        "experience",
    }
)


class RankingService:
    def __init__(self, weights: dict[str, float] | None = None) -> None:
        self.weights = dict(weights or DEFAULT_RANKING_WEIGHTS)
        self._validate_weights()

    def rank_candidates(self, request: RankingRequest) -> list[RankedCandidate]:
        """Rank all candidates for a job description by weighted hybrid score."""
        logger.info(
            "Ranking started",
            extra={
                "candidate_count": len(request.candidates),
                "job_description_length": len(request.job_description),
            },
        )

        ranked: list[RankedCandidate] = []
        for candidate in request.candidates:
            ranked.append(self._evaluate_candidate(request.job_description, candidate))

        ranked.sort(key=lambda item: (-item.final_score, item.candidate_id))

        logger.info(
            "Ranking completed",
            extra={
                "candidate_count": len(ranked),
                "top_candidate_id": ranked[0].candidate_id if ranked else None,
                "top_final_score": ranked[0].final_score if ranked else None,
            },
        )
        return ranked

    def score_semantic_similarity(
        self, job_description: str, candidate_profile: str
    ) -> float:
        """Semantic similarity between job description and candidate profile (0–100)."""
        return self._normalize_score(
            similarity_service.compute_similarity(job_description, candidate_profile)
        )

    def score_skills_match(self, job_description: str, skills: list[str] | None) -> float:
        """Skills overlap score against job requirements (0–100)."""
        safe_skills = skills or []
        if not safe_skills:
            return 0.0

        job_lower = job_description.lower()
        matched = sum(1 for skill in safe_skills if self._skill_matches_job(skill, job_lower))
        return self._normalize_score((matched / len(safe_skills)) * 100.0)

    def score_project_relevance(
        self, job_description: str, projects: list[str] | None
    ) -> float:
        """Relevance of candidate projects to the job (0–100)."""
        safe_projects = [project.strip() for project in (projects or []) if project and project.strip()]
        if not safe_projects:
            return 0.0

        projects_text = ". ".join(safe_projects)
        return self._normalize_score(
            similarity_service.compute_similarity(job_description, projects_text)
        )

    def score_experience_match(
        self, job_description: str, experience: float | None
    ) -> float:
        """Experience level fit score (0–100)."""
        years = max(0.0, experience or 0.0)
        required_years = self._extract_required_years(job_description)

        if years == 0.0:
            if self._is_entry_level_job(job_description):
                return 80.0
            return 0.0

        if required_years is None:
            return self._normalize_score(min(years / 5.0, 1.0) * 100.0)

        if years >= required_years:
            return 100.0

        return self._normalize_score((years / required_years) * 100.0)

    def score_certification(
        self, job_description: str, certifications: list[str] | None
    ) -> float:
        """Certification relevance score (0–100)."""
        safe_certs = certifications or []
        if not safe_certs:
            return 0.0

        job_lower = job_description.lower()
        matched = sum(
            1 for cert in safe_certs if self._text_matches_job(cert, job_lower)
        )
        return self._normalize_score((matched / len(safe_certs)) * 100.0)

    def score_education(self, job_description: str, education: str | None) -> float:
        """Education relevance score (0–100)."""
        if not education or not education.strip():
            return 0.0

        job_lower = job_description.lower()
        edu_lower = education.strip().lower()

        if self._text_matches_job(education, job_lower):
            return 100.0

        degree_match = any(keyword in job_lower and keyword in edu_lower for keyword in _DEGREE_KEYWORDS)
        edu_tokens = self._tokenize(education)
        job_tokens = self._tokenize(job_description)
        overlap_ratio = len(edu_tokens & job_tokens) / len(edu_tokens) if edu_tokens else 0.0
        base_score = overlap_ratio * 100.0

        if degree_match:
            base_score = max(base_score, 70.0)

        return self._normalize_score(base_score)

    def _evaluate_candidate(
        self, job_description: str, candidate: Candidate
    ) -> RankedCandidate:
        logger.info(
            "Evaluating candidate",
            extra={
                "candidate_id": candidate.candidate_id,
                "candidate_name": candidate.name,
            },
        )

        component_scores = {
            "semantic_similarity": self.score_semantic_similarity(
                job_description, candidate.profile
            ),
            "skills_match": self.score_skills_match(job_description, candidate.skills),
            "project_relevance": self.score_project_relevance(
                job_description, candidate.projects
            ),
            "experience_match": self.score_experience_match(
                job_description, candidate.experience
            ),
            "certification_score": self.score_certification(
                job_description, candidate.certifications
            ),
            "education_score": self.score_education(job_description, candidate.education),
        }

        final_score = self._compute_final_score(component_scores)
        explanation = self._generate_explanation(component_scores)

        logger.info(
            "Candidate scored",
            extra={
                "candidate_id": candidate.candidate_id,
                "component_scores": component_scores,
                "final_score": final_score,
            },
        )

        return RankedCandidate(
            candidate_id=candidate.candidate_id,
            name=candidate.name,
            final_score=final_score,
            semantic_similarity=component_scores["semantic_similarity"],
            skills_match=component_scores["skills_match"],
            project_relevance=component_scores["project_relevance"],
            experience_match=component_scores["experience_match"],
            certification_score=component_scores["certification_score"],
            education_score=component_scores["education_score"],
            explanation=explanation,
        )

    def _compute_final_score(self, component_scores: dict[str, float]) -> float:
        weighted = sum(
            self.weights[component] * component_scores[component]
            for component in _SCORE_COMPONENTS
        )
        return self._normalize_score(weighted)

    def _generate_explanation(self, component_scores: dict[str, float]) -> str:
        phrases: list[str] = []
        for component in _SCORE_COMPONENTS:
            score = component_scores[component]
            for threshold, phrase in _EXPLANATION_TIERS[component]:
                if score >= threshold:
                    phrases.append(phrase)
                    break

        if not phrases:
            return "Moderate overall fit for this role."

        if len(phrases) == 1:
            return phrases[0].capitalize() + "."

        return (", ".join(phrases[:-1]) + ", and " + phrases[-1]).capitalize() + "."

    def _validate_weights(self) -> None:
        missing = set(_SCORE_COMPONENTS) - set(self.weights)
        if missing:
            raise ValueError(f"Missing ranking weights for: {sorted(missing)}")

        total = sum(self.weights[component] for component in _SCORE_COMPONENTS)
        if not (0.99 <= total <= 1.01):
            raise ValueError(f"Ranking weights must sum to 1.0, got {total:.4f}")

    @staticmethod
    def _normalize_score(score: float) -> float:
        return round(max(0.0, min(100.0, score)), 2)

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        return {
            token
            for token in re.findall(r"[a-z0-9+#.]+", text.lower())
            if len(token) > 2 and token not in _STOPWORDS
        }

    @staticmethod
    def _skill_matches_job(skill: str, job_lower: str) -> bool:
        skill_lower = skill.strip().lower()
        if not skill_lower:
            return False
        if skill_lower in job_lower:
            return True
        return any(
            len(part) > 2 and part in job_lower
            for part in re.split(r"[/,\s]+", skill_lower)
        )

    @staticmethod
    def _text_matches_job(text: str, job_lower: str) -> bool:
        text_lower = text.strip().lower()
        if not text_lower:
            return False
        if text_lower in job_lower:
            return True
        return any(
            len(token) > 3 and token in job_lower
            for token in re.split(r"[/,\s]+", text_lower)
        )

    @staticmethod
    def _extract_required_years(job_description: str) -> float | None:
        plus_match = re.search(
            r"(\d+)\+\s*(?:years?|yrs?)\b", job_description, re.IGNORECASE
        )
        if plus_match:
            return float(plus_match.group(1))

        range_match = re.search(
            r"(\d+)\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)\b",
            job_description,
            re.IGNORECASE,
        )
        if range_match:
            return float(range_match.group(1))

        simple_match = re.search(
            r"(\d+)\s*(?:years?|yrs?)\b", job_description, re.IGNORECASE
        )
        if simple_match:
            return float(simple_match.group(1))

        return None

    @staticmethod
    def _is_entry_level_job(job_description: str) -> bool:
        job_lower = job_description.lower()
        return any(keyword in job_lower for keyword in _ENTRY_LEVEL_KEYWORDS)


ranking_service = RankingService()
