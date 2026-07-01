import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

from ai_client import AIServiceError, RankedCandidateResult, RankingResult
from models.candidate import CandidateProfile
from models.job import JobPosting
from repositories.candidate_repository import CandidateRepositoryError
from repositories.job_repository import JobRepositoryError
from routers.jobs_router import router
from services.ai_ranking_service import AIRankingService


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router, prefix="/api")
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_job() -> JobPosting:
    return JobPosting(
        job_id="job-001",
        title="Senior Python Developer",
        description="Build FastAPI services and ML pipelines on AWS.",
        required_skills=["Python", "FastAPI", "AWS"],
        required_experience="5+ years",
        education="Bachelor's in Computer Science",
        certifications=["AWS Solutions Architect"],
    )


@pytest.fixture
def sample_candidates() -> list[CandidateProfile]:
    return [
        CandidateProfile(
            candidate_id="cand-001",
            full_name="Priya Sharma",
            profile_summary="Senior Python engineer with FastAPI and AWS experience.",
            skills=["Python", "FastAPI", "AWS"],
            projects=["Talent matching platform"],
            years_of_experience=6.0,
            certifications=["AWS Solutions Architect"],
            education="B.Tech Computer Science",
        ),
        CandidateProfile(
            candidate_id="cand-002",
            full_name="Arjun Patel",
            profile_summary="Backend developer with Python and Django experience.",
            skills=["Python", "Django"],
            projects=["E-commerce API"],
            years_of_experience=4.0,
            certifications=[],
            education="B.Sc Information Technology",
        ),
    ]


@pytest.fixture
def sample_ranking_result() -> RankingResult:
    return RankingResult(
        rankings=[
            RankedCandidateResult(
                candidate_id="cand-001",
                name="Priya Sharma",
                final_score=85.0,
                semantic_similarity=80.0,
                skills_match=90.0,
                project_relevance=75.0,
                experience_match=100.0,
                certification_score=80.0,
                education_score=70.0,
                explanation="Strong skill overlap and appropriate experience.",
            ),
            RankedCandidateResult(
                candidate_id="cand-002",
                name="Arjun Patel",
                final_score=55.0,
                semantic_similarity=60.0,
                skills_match=65.0,
                project_relevance=50.0,
                experience_match=80.0,
                certification_score=0.0,
                education_score=40.0,
                explanation="Partial skill overlap and reasonable experience fit.",
            ),
        ]
    )


def test_get_ai_suggestions_success(
    client,
    sample_job,
    sample_candidates,
    sample_ranking_result,
):
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.return_value = sample_job
    mock_candidate_repo = MagicMock()
    mock_candidate_repo.get_active_candidates.return_value = sample_candidates
    mock_ai_client = MagicMock()
    mock_ai_client.rank_candidates = AsyncMock(return_value=sample_ranking_result)

    service = AIRankingService(
        job_repository=mock_job_repo,
        candidate_repository=mock_candidate_repo,
        ai_client=mock_ai_client,
    )

    with patch("routers.jobs_router.ai_ranking_service", service):
        response = client.get("/api/jobs/job-001/ai-suggestions")

    assert response.status_code == 200
    data = response.json()
    assert data["job"]["job_id"] == "job-001"
    assert data["candidate_count"] == 2
    assert len(data["rankings"]) == 2
    assert data["rankings"][0]["candidate_id"] == "cand-001"
    assert data["rankings"][0]["final_score"] == 85.0
    assert data["rankings"][0]["explanation"]
    assert data["rankings"][0]["semantic_similarity"] == 80.0
    scores = [item["final_score"] for item in data["rankings"]]
    assert scores == sorted(scores, reverse=True)
    mock_ai_client.rank_candidates.assert_awaited_once()


def test_get_ai_suggestions_missing_job(client):
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.return_value = None
    mock_candidate_repo = MagicMock()
    mock_ai_client = MagicMock()
    mock_ai_client.rank_candidates = AsyncMock()

    service = AIRankingService(
        job_repository=mock_job_repo,
        candidate_repository=mock_candidate_repo,
        ai_client=mock_ai_client,
    )

    with patch("routers.jobs_router.ai_ranking_service", service):
        response = client.get("/api/jobs/missing-job/ai-suggestions")

    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found."
    mock_ai_client.rank_candidates.assert_not_called()


def test_get_ai_suggestions_ai_service_unavailable(
    client,
    sample_job,
    sample_candidates,
):
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.return_value = sample_job
    mock_candidate_repo = MagicMock()
    mock_candidate_repo.get_active_candidates.return_value = sample_candidates
    mock_ai_client = MagicMock()
    mock_ai_client.rank_candidates = AsyncMock(
        side_effect=AIServiceError("The AI service is temporarily unavailable. Please try again later.")
    )

    service = AIRankingService(
        job_repository=mock_job_repo,
        candidate_repository=mock_candidate_repo,
        ai_client=mock_ai_client,
    )

    with patch("routers.jobs_router.ai_ranking_service", service):
        response = client.get("/api/jobs/job-001/ai-suggestions")

    assert response.status_code == 503
    assert "temporarily unavailable" in response.json()["detail"]


def test_get_ai_suggestions_empty_candidate_list(client, sample_job):
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.return_value = sample_job
    mock_candidate_repo = MagicMock()
    mock_candidate_repo.get_active_candidates.return_value = []
    mock_ai_client = MagicMock()
    mock_ai_client.rank_candidates = AsyncMock()

    service = AIRankingService(
        job_repository=mock_job_repo,
        candidate_repository=mock_candidate_repo,
        ai_client=mock_ai_client,
    )

    with patch("routers.jobs_router.ai_ranking_service", service):
        response = client.get("/api/jobs/job-001/ai-suggestions")

    assert response.status_code == 200
    data = response.json()
    assert data["candidate_count"] == 0
    assert data["rankings"] == []
    mock_ai_client.rank_candidates.assert_not_called()


def test_get_ai_suggestions_database_failure(client):
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.side_effect = JobRepositoryError("db down")
    mock_candidate_repo = MagicMock()
    mock_ai_client = MagicMock()

    service = AIRankingService(
        job_repository=mock_job_repo,
        candidate_repository=mock_candidate_repo,
        ai_client=mock_ai_client,
    )

    with patch("routers.jobs_router.ai_ranking_service", service):
        response = client.get("/api/jobs/job-001/ai-suggestions")

    assert response.status_code == 500
    assert "Unable to retrieve data" in response.json()["detail"]


def test_get_ai_suggestions_candidate_database_failure(client, sample_job):
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.return_value = sample_job
    mock_candidate_repo = MagicMock()
    mock_candidate_repo.get_active_candidates.side_effect = CandidateRepositoryError("db down")
    mock_ai_client = MagicMock()

    service = AIRankingService(
        job_repository=mock_job_repo,
        candidate_repository=mock_candidate_repo,
        ai_client=mock_ai_client,
    )

    with patch("routers.jobs_router.ai_ranking_service", service):
        response = client.get("/api/jobs/job-001/ai-suggestions")

    assert response.status_code == 500
    assert "Unable to retrieve data" in response.json()["detail"]


def test_get_ai_suggestions_openapi_documented(client):
    schema = client.get("/openapi.json").json()
    path = schema["paths"]["/api/jobs/{job_id}/ai-suggestions"]["get"]
    assert path["summary"]
    assert "404" in path["responses"]
    assert "503" in path["responses"]
    assert "500" in path["responses"]
