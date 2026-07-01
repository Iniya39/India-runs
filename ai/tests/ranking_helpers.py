"""Shared helpers and fixtures for ranking engine tests."""

from __future__ import annotations

from typing import Any

from app.schemas.ranking import RankingResponse
from app.services.ranking import DEFAULT_RANKING_WEIGHTS

JOB_DESCRIPTION = (
    "Senior Python developer with 5+ years of experience in FastAPI, "
    "machine learning, and AWS. Bachelor's in Computer Science preferred. "
    "AWS Solutions Architect certification is a plus."
)

SCORE_FIELDS = (
    "final_score",
    "semantic_similarity",
    "skills_match",
    "project_relevance",
    "experience_match",
    "certification_score",
    "education_score",
)

COMPONENT_FIELDS = SCORE_FIELDS[1:]


def candidate_payload(candidate_id: str = "cand-001", **overrides: Any) -> dict[str, Any]:
    base = {
        "candidate_id": candidate_id,
        "name": "Priya Sharma",
        "profile": (
            "Senior Python engineer with 6 years building FastAPI backends, "
            "ML pipelines, and AWS cloud services."
        ),
        "skills": ["Python", "FastAPI", "AWS", "Machine Learning"],
        "projects": ["Talent matching platform using Python, FastAPI, and AWS"],
        "experience": 6.0,
        "certifications": ["AWS Solutions Architect"],
        "education": "B.Tech in Computer Science",
    }
    base.update(overrides)
    return base


STRONG_CANDIDATE = candidate_payload(
    candidate_id="cand-strong",
    name="Priya Sharma",
)

MODERATE_CANDIDATE = candidate_payload(
    candidate_id="cand-moderate",
    name="Arjun Patel",
    profile="Backend developer with Python and Django experience on cloud platforms.",
    skills=["Python", "Django", "AWS"],
    projects=["E-commerce API built with Python and Django"],
    experience=4.0,
    certifications=[],
    education="B.Sc in Information Technology",
)

WEAK_CANDIDATE = candidate_payload(
    candidate_id="cand-weak",
    name="Marie Dubois",
    profile="Professional pastry chef specializing in French desserts and bakery management.",
    skills=["Baking", "Pastry"],
    projects=["Artisan sourdough bakery operations"],
    experience=4.0,
    certifications=["Culinary Arts Diploma"],
    education="Diploma in Culinary Arts",
)


def ranking_payload(
    job_description: str = JOB_DESCRIPTION,
    candidates: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "job_description": job_description,
        "candidates": [STRONG_CANDIDATE] if candidates is None else candidates,
    }


def generate_candidate_batch(count: int) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for index in range(count):
        is_strong = index % 3 == 0
        is_moderate = index % 3 == 1
        if is_strong:
            profile = (
                f"Python FastAPI AWS machine learning backend developer candidate {index}"
            )
            skills = ["Python", "FastAPI", "AWS", "Machine Learning"]
            experience = 6.0 + (index % 3)
        elif is_moderate:
            profile = f"Python developer with some cloud experience candidate {index}"
            skills = ["Python", "Django", "AWS"]
            experience = 3.0 + (index % 2)
        else:
            profile = f"Unrelated retail operations specialist candidate {index}"
            skills = ["Retail", "Sales"]
            experience = 2.0

        candidates.append(
            candidate_payload(
                candidate_id=f"cand-{index:03d}",
                name=f"Candidate {index}",
                profile=profile,
                skills=skills,
                projects=[f"Project {index} using {' '.join(skills[:2])}"],
                experience=experience,
                certifications=["AWS Solutions Architect"] if is_strong else [],
                education="B.Tech Computer Science" if is_strong else "B.A. General",
            )
        )
    return candidates


def extract_score(ranked: dict[str, Any] | Any, field: str) -> float:
    if isinstance(ranked, dict):
        return float(ranked[field])
    return float(getattr(ranked, field))


def compute_expected_final_score(
    ranked: dict[str, Any] | Any,
    weights: dict[str, float] | None = None,
) -> float:
    active_weights = weights or DEFAULT_RANKING_WEIGHTS
    weighted = sum(
        active_weights[component] * extract_score(ranked, component)
        for component in COMPONENT_FIELDS
    )
    return round(max(0.0, min(100.0, weighted)), 2)


def assert_rankings_sorted_descending(rankings: list[dict[str, Any] | Any]) -> None:
    scores = [extract_score(item, "final_score") for item in rankings]
    assert scores == sorted(scores, reverse=True)


def assert_scores_within_bounds(ranked: dict[str, Any] | Any) -> None:
    for field in SCORE_FIELDS:
        score = extract_score(ranked, field)
        assert 0.0 <= score <= 100.0, f"{field}={score} is out of bounds"


def assert_explanation_present_and_deterministic(explanation: str) -> None:
    assert isinstance(explanation, str)
    assert explanation.strip()
    assert explanation.endswith(".")


def assert_ranking_response_valid(data: dict[str, Any]) -> RankingResponse:
    response = RankingResponse.model_validate(data)
    assert_rankings_sorted_descending(response.rankings)
    for ranked in response.rankings:
        assert_scores_within_bounds(ranked.model_dump())
        assert_explanation_present_and_deterministic(ranked.explanation)
        assert ranked.final_score == compute_expected_final_score(ranked.model_dump())
    return response
