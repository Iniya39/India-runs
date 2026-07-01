import pytest
from unittest.mock import patch

from app.schemas.ranking import Candidate, RankingRequest
from app.services.ranking import DEFAULT_RANKING_WEIGHTS, RankingService
from tests.ranking_helpers import (
    JOB_DESCRIPTION,
    COMPONENT_FIELDS,
    compute_expected_final_score,
    assert_scores_within_bounds,
    assert_explanation_present_and_deterministic,
)

def _candidate(**overrides) -> Candidate:
    base = {
        "candidate_id": "cand-001",
        "name": "Priya Sharma",
        "profile": "Senior Python engineer with FastAPI, AWS, and machine learning experience.",
        "skills": ["Python", "FastAPI", "AWS", "Machine Learning"],
        "projects": ["Talent matching platform using Python and FastAPI"],
        "experience": 6.0,
        "certifications": ["AWS Solutions Architect"],
        "education": "B.Tech in Computer Science",
    }
    base.update(overrides)
    return Candidate(**base)


def _request(job_description: str, candidates: list[Candidate]) -> RankingRequest:
    return RankingRequest(job_description=job_description, candidates=candidates)


@pytest.fixture
def ranking_service_instance() -> RankingService:    return RankingService()


@pytest.fixture
def fixed_scores():
    """Patch component scorers for deterministic weighted-score tests."""
    scores = {
        "semantic_similarity": 80.0,
        "skills_match": 70.0,
        "project_relevance": 60.0,
        "experience_match": 90.0,
        "certification_score": 50.0,
        "education_score": 40.0,
    }

    with (
        patch.object(RankingService, "score_semantic_similarity", return_value=scores["semantic_similarity"]),
        patch.object(RankingService, "score_skills_match", return_value=scores["skills_match"]),
        patch.object(RankingService, "score_project_relevance", return_value=scores["project_relevance"]),
        patch.object(RankingService, "score_experience_match", return_value=scores["experience_match"]),
        patch.object(RankingService, "score_certification", return_value=scores["certification_score"]),
        patch.object(RankingService, "score_education", return_value=scores["education_score"]),
    ):
        yield scores


def test_ranking_order_descending_by_final_score(ranking_service_instance):
    strong = _candidate(
        candidate_id="cand-strong",
        name="Strong Match",
        profile="Python FastAPI AWS machine learning backend developer",
        skills=["Python", "FastAPI", "AWS", "Machine Learning"],
        projects=["Python FastAPI backend for machine learning platform on AWS"],
        experience=6.0,
        certifications=["AWS Solutions Architect"],
        education="B.Tech Computer Science",
    )
    weak = _candidate(
        candidate_id="cand-weak",
        name="Weak Match",
        profile="Pastry chef specializing in French desserts and bakery management.",
        skills=["Baking", "Pastry"],
        projects=["Artisan sourdough bakery operations"],
        experience=4.0,
        certifications=["Culinary Arts Diploma"],
        education="Diploma in Culinary Arts",
    )

    rankings = ranking_service_instance.rank_candidates(
        _request(JOB_DESCRIPTION, [weak, strong])
    )

    assert len(rankings) == 2
    assert rankings[0].candidate_id == "cand-strong"
    assert rankings[1].candidate_id == "cand-weak"
    assert rankings[0].final_score > rankings[1].final_score


def test_equal_candidate_scores_stable_order(ranking_service_instance, fixed_scores):
    expected_final = round(
        sum(DEFAULT_RANKING_WEIGHTS[key] * fixed_scores[key] for key in DEFAULT_RANKING_WEIGHTS),
        2,
    )

    cand_a = _candidate(candidate_id="cand-a", name="Candidate A")
    cand_b = _candidate(candidate_id="cand-b", name="Candidate B")

    rankings = ranking_service_instance.rank_candidates(
        _request(JOB_DESCRIPTION, [cand_b, cand_a])
    )

    assert rankings[0].final_score == expected_final
    assert rankings[1].final_score == expected_final
    assert rankings[0].candidate_id == "cand-a"
    assert rankings[1].candidate_id == "cand-b"


def test_weighted_score_calculation(ranking_service_instance, fixed_scores):
    rankings = ranking_service_instance.rank_candidates(
        _request(JOB_DESCRIPTION, [_candidate()])
    )

    expected = round(
        sum(DEFAULT_RANKING_WEIGHTS[key] * fixed_scores[key] for key in DEFAULT_RANKING_WEIGHTS),
        2,
    )
    assert rankings[0].final_score == expected
    assert rankings[0].semantic_similarity == fixed_scores["semantic_similarity"]
    assert rankings[0].skills_match == fixed_scores["skills_match"]


def test_missing_optional_fields_do_not_crash(ranking_service_instance):
    candidate = _candidate(
        skills=[],
        projects=[],
        certifications=[],
        education="",
        experience=0.0,
    )
    rankings = ranking_service_instance.rank_candidates(
        _request(JOB_DESCRIPTION, [candidate])
    )

    assert len(rankings) == 1
    ranked = rankings[0]
    assert ranked.skills_match == 0.0
    assert ranked.project_relevance == 0.0
    assert ranked.certification_score == 0.0
    assert ranked.education_score == 0.0
    assert 0.0 <= ranked.final_score <= 100.0


def test_empty_skills_score_zero(ranking_service_instance):
    score = ranking_service_instance.score_skills_match(
        JOB_DESCRIPTION, []
    )
    assert score == 0.0


def test_empty_projects_score_zero(ranking_service_instance):
    score = ranking_service_instance.score_project_relevance(
        JOB_DESCRIPTION, []
    )
    assert score == 0.0


def test_no_certifications_score_zero(ranking_service_instance):
    score = ranking_service_instance.score_certification(
        JOB_DESCRIPTION, []
    )
    assert score == 0.0


def test_zero_experience_handled_gracefully(ranking_service_instance):
    senior_score = ranking_service_instance.score_experience_match(
        JOB_DESCRIPTION, 0.0
    )
    entry_score = ranking_service_instance.score_experience_match(
        "Junior entry-level graduate role with no experience required.",
        0.0,
    )

    assert senior_score == 0.0
    assert entry_score == 80.0


def test_explanation_generation_high_scores(ranking_service_instance, fixed_scores):
    rankings = ranking_service_instance.rank_candidates(
        _request(JOB_DESCRIPTION, [_candidate()])
    )

    explanation = rankings[0].explanation
    assert isinstance(explanation, str)
    assert explanation.endswith(".")
    assert "semantic alignment" in explanation.lower()
    assert "skill overlap" in explanation.lower()


def test_explanation_generation_low_scores(ranking_service_instance):
    low_scores = {
        "semantic_similarity": 10.0,
        "skills_match": 5.0,
        "project_relevance": 0.0,
        "experience_match": 10.0,
        "certification_score": 0.0,
        "education_score": 0.0,
    }

    with (
        patch.object(RankingService, "score_semantic_similarity", return_value=low_scores["semantic_similarity"]),
        patch.object(RankingService, "score_skills_match", return_value=low_scores["skills_match"]),
        patch.object(RankingService, "score_project_relevance", return_value=low_scores["project_relevance"]),
        patch.object(RankingService, "score_experience_match", return_value=low_scores["experience_match"]),
        patch.object(RankingService, "score_certification", return_value=low_scores["certification_score"]),
        patch.object(RankingService, "score_education", return_value=low_scores["education_score"]),
    ):
        rankings = ranking_service_instance.rank_candidates(
            _request(JOB_DESCRIPTION, [_candidate()])
        )

    assert rankings[0].explanation == "Moderate overall fit for this role."


def test_explanation_is_deterministic(ranking_service_instance, fixed_scores):
    request = _request(JOB_DESCRIPTION, [_candidate()])

    first = ranking_service_instance.rank_candidates(request)[0].explanation
    second = ranking_service_instance.rank_candidates(request)[0].explanation

    assert first == second


def test_ranked_candidate_schema_fields(ranking_service_instance):
    rankings = ranking_service_instance.rank_candidates(
        _request(JOB_DESCRIPTION, [_candidate()])
    )
    ranked = rankings[0]

    assert ranked.candidate_id == "cand-001"
    assert ranked.name == "Priya Sharma"
    assert 0.0 <= ranked.final_score <= 100.0
    assert 0.0 <= ranked.semantic_similarity <= 100.0
    assert ranked.explanation


def test_custom_weights_used_in_final_score():
    custom_weights = {
        "semantic_similarity": 1.0,
        "skills_match": 0.0,
        "project_relevance": 0.0,
        "experience_match": 0.0,
        "certification_score": 0.0,
        "education_score": 0.0,
    }
    service = RankingService(weights=custom_weights)

    with patch.object(
        RankingService,
        "score_semantic_similarity",
        return_value=92.5,
    ), patch.object(RankingService, "score_skills_match", return_value=10.0), patch.object(
        RankingService, "score_project_relevance", return_value=10.0
    ), patch.object(
        RankingService, "score_experience_match", return_value=10.0
    ), patch.object(
        RankingService, "score_certification", return_value=10.0
    ), patch.object(
        RankingService, "score_education", return_value=10.0
    ):
        rankings = service.rank_candidates(_request(JOB_DESCRIPTION, [_candidate()]))

    assert rankings[0].final_score == 92.5


def test_invalid_weights_raise_error():
    with pytest.raises(ValueError, match="sum to 1.0"):
        RankingService(
            weights={
                "semantic_similarity": 0.5,
                "skills_match": 0.5,
                "project_relevance": 0.5,
                "experience_match": 0.0,
                "certification_score": 0.0,
                "education_score": 0.0,
            }
        )


def test_missing_education_score_zero(ranking_service_instance):
    score = ranking_service_instance.score_education(JOB_DESCRIPTION, "")
    assert score == 0.0


def test_missing_education_none_treated_as_empty(ranking_service_instance):
    score = ranking_service_instance.score_education(JOB_DESCRIPTION, None)
    assert score == 0.0


@pytest.mark.parametrize("component", COMPONENT_FIELDS)
def test_component_scores_normalized_to_percentage(
    ranking_service_instance, component, fixed_scores
):
    rankings = ranking_service_instance.rank_candidates(
        _request(JOB_DESCRIPTION, [_candidate()])
    )
    ranked = rankings[0].model_dump()
    assert_scores_within_bounds(ranked)
    assert 0.0 <= ranked[component] <= 100.0


def test_weighted_score_matches_formula_for_each_candidate(
    ranking_service_instance, fixed_scores
):
    rankings = ranking_service_instance.rank_candidates(
        _request(
            JOB_DESCRIPTION,
            [_candidate(candidate_id="cand-a"), _candidate(candidate_id="cand-b")],
        )
    )

    for ranked in rankings:
        expected = compute_expected_final_score(ranked.model_dump())
        assert ranked.final_score == expected


def test_identical_candidate_scores_share_same_final_score(
    ranking_service_instance, fixed_scores
):
    rankings = ranking_service_instance.rank_candidates(
        _request(
            JOB_DESCRIPTION,
            [
                _candidate(candidate_id="cand-x", name="Candidate X"),
                _candidate(candidate_id="cand-y", name="Candidate Y"),
            ],
        )
    )

    assert rankings[0].final_score == rankings[1].final_score
    assert rankings[0].explanation == rankings[1].explanation


def test_all_component_scorers_return_bounded_values(ranking_service_instance):
    candidate = _candidate()
    scores = {
        "semantic_similarity": ranking_service_instance.score_semantic_similarity(
            JOB_DESCRIPTION, candidate.profile
        ),
        "skills_match": ranking_service_instance.score_skills_match(
            JOB_DESCRIPTION, candidate.skills
        ),
        "project_relevance": ranking_service_instance.score_project_relevance(
            JOB_DESCRIPTION, candidate.projects
        ),
        "experience_match": ranking_service_instance.score_experience_match(
            JOB_DESCRIPTION, candidate.experience
        ),
        "certification_score": ranking_service_instance.score_certification(
            JOB_DESCRIPTION, candidate.certifications
        ),
        "education_score": ranking_service_instance.score_education(
            JOB_DESCRIPTION, candidate.education
        ),
    }

    for component, score in scores.items():
        assert 0.0 <= score <= 100.0, f"{component} returned {score}"


def test_explanation_present_for_all_ranked_candidates(ranking_service_instance):
    rankings = ranking_service_instance.rank_candidates(
        _request(
            JOB_DESCRIPTION,
            [
                _candidate(candidate_id="cand-a"),
                _candidate(
                    candidate_id="cand-b",
                    skills=[],
                    projects=[],
                    certifications=[],
                    education="",
                    experience=0.0,
                ),
            ],
        )
    )

    for ranked in rankings:
        assert_explanation_present_and_deterministic(ranked.explanation)