import pytest
from pydantic import ValidationError

from app.schemas import (
    Candidate,
    RankingRequest,
    RankedCandidate,
    RankingResponse,
)


def _valid_candidate(**overrides) -> dict:
    base = {
        "candidate_id": "cand-001",
        "name": "Priya Sharma",
        "profile": "Senior Python engineer with FastAPI and AWS experience.",
        "skills": ["Python", "FastAPI", "AWS"],
        "projects": ["Talent matching platform"],
        "experience": 6.0,
        "certifications": ["AWS Solutions Architect"],
        "education": "B.Tech in Computer Science",
    }
    base.update(overrides)
    return base


def _valid_ranking_request(**overrides) -> dict:
    base = {
        "job_description": "Senior Python developer with FastAPI and AWS experience.",
        "candidates": [_valid_candidate()],
    }
    base.update(overrides)
    return base


def _valid_ranked_candidate(**overrides) -> dict:
    base = {
        "candidate_id": "cand-001",
        "name": "Priya Sharma",
        "final_score": 87.5,
        "semantic_similarity": 88.0,
        "skills_match": 90.0,
        "project_relevance": 82.0,
        "experience_match": 85.0,
        "certification_score": 80.0,
        "education_score": 78.0,
        "explanation": "Strong Python and FastAPI alignment with relevant AWS certifications.",
    }
    base.update(overrides)
    return base


# --- Candidate ---


def test_candidate_valid():
    candidate = Candidate(**_valid_candidate())
    assert candidate.candidate_id == "cand-001"
    assert candidate.experience == 6.0


def test_candidate_rejects_empty_candidate_id():
    with pytest.raises(ValidationError) as exc_info:
        Candidate(**_valid_candidate(candidate_id=""))
    assert "candidate_id" in str(exc_info.value)


def test_candidate_rejects_negative_experience():
    with pytest.raises(ValidationError) as exc_info:
        Candidate(**_valid_candidate(experience=-1))
    assert "experience" in str(exc_info.value)


# --- RankingRequest ---


def test_ranking_request_valid():
    request = RankingRequest(**_valid_ranking_request())
    assert len(request.candidates) == 1
    assert request.job_description.startswith("Senior Python")


def test_ranking_request_rejects_empty_job_description():
    with pytest.raises(ValidationError) as exc_info:
        RankingRequest(**_valid_ranking_request(job_description=""))
    assert "job_description" in str(exc_info.value)


def test_ranking_request_rejects_empty_candidates():
    with pytest.raises(ValidationError) as exc_info:
        RankingRequest(**_valid_ranking_request(candidates=[]))
    assert "candidates" in str(exc_info.value)


# --- RankedCandidate & RankingResponse ---


def test_ranked_candidate_valid():
    ranked = RankedCandidate(**_valid_ranked_candidate())
    assert ranked.final_score == 87.5


def test_ranking_response_valid():
    response = RankingResponse(rankings=[RankedCandidate(**_valid_ranked_candidate())])
    assert len(response.rankings) == 1
    assert response.rankings[0].name == "Priya Sharma"


# --- OpenAPI ---


RANKING_SCHEMA_NAMES = {"Candidate", "RankingRequest", "RankedCandidate", "RankingResponse"}


def test_ranking_schemas_in_openapi(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schemas = response.json()["components"]["schemas"]
    missing = RANKING_SCHEMA_NAMES - set(schemas.keys())
    assert not missing, f"Missing ranking schemas in OpenAPI: {missing}"


def test_openapi_candidate_schema_fields(client):
    schema = client.get("/openapi.json").json()["components"]["schemas"]["Candidate"]
    properties = schema["properties"]
    for field in (
        "candidate_id",
        "name",
        "profile",
        "skills",
        "projects",
        "experience",
        "certifications",
        "education",
    ):
        assert field in properties
        assert "description" in properties[field]


def test_openapi_ranking_request_references_candidate(client):
    schema = client.get("/openapi.json").json()["components"]["schemas"]["RankingRequest"]
    candidates_ref = schema["properties"]["candidates"]["items"]["$ref"]
    assert candidates_ref == "#/components/schemas/Candidate"


def test_openapi_ranked_candidate_score_fields(client):
    schema = client.get("/openapi.json").json()["components"]["schemas"]["RankedCandidate"]
    properties = schema["properties"]
    for field in (
        "final_score",
        "semantic_similarity",
        "skills_match",
        "project_relevance",
        "experience_match",
        "certification_score",
        "education_score",
        "explanation",
    ):
        assert field in properties
        assert "description" in properties[field]


def test_openapi_ranking_response_references_ranked_candidate(client):
    schema = client.get("/openapi.json").json()["components"]["schemas"]["RankingResponse"]
    rankings_ref = schema["properties"]["rankings"]["items"]["$ref"]
    assert rankings_ref == "#/components/schemas/RankedCandidate"
