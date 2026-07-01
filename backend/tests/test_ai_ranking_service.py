import pytest
from unittest.mock import AsyncMock, MagicMock

from ai_client import CandidateInput, RankingResult, RankedCandidateResult
from models.candidate import CandidateProfile
from models.job import JobPosting
from repositories.job_repository import JobRepositoryError
from services.ai_ranking_service import AIRankingService, JobNotFoundError


@pytest.fixture
def sample_job() -> JobPosting:
    return JobPosting(
        job_id="job-001",
        title="Senior Python Developer",
        description="Build FastAPI services on AWS.",
        required_skills=["Python", "FastAPI"],
        required_experience="5+ years",
        education="Bachelor's degree",
        certifications=["AWS Solutions Architect"],
    )


@pytest.mark.asyncio
async def test_service_builds_candidate_input_for_ai(sample_job):
    candidate = CandidateProfile(
        candidate_id="cand-001",
        full_name="Priya Sharma",
        profile_summary="Python engineer",
        skills=["Python"],
        projects=["API platform"],
        years_of_experience=5.0,
        certifications=[],
        education="B.Tech",
    )

    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.return_value = sample_job
    mock_candidate_repo = MagicMock()
    mock_candidate_repo.get_active_candidates.return_value = [candidate]

    ranking = RankingResult(
        rankings=[
            RankedCandidateResult(
                candidate_id="cand-001",
                name="Priya Sharma",
                final_score=80.0,
                semantic_similarity=75.0,
                skills_match=85.0,
                project_relevance=70.0,
                experience_match=90.0,
                certification_score=0.0,
                education_score=60.0,
                explanation="Good semantic alignment.",
            )
        ]
    )
    mock_ai_client = MagicMock()
    mock_ai_client.rank_candidates = AsyncMock(return_value=ranking)

    service = AIRankingService(
        job_repository=mock_job_repo,
        candidate_repository=mock_candidate_repo,
        ai_client=mock_ai_client,
    )

    result = await service.get_ai_suggestions("job-001")

    assert result.job.job_id == "job-001"
    assert result.candidate_count == 1
    mock_ai_client.rank_candidates.assert_awaited_once()
    args, _ = mock_ai_client.rank_candidates.await_args
    assert "Python" in args[0]
    assert isinstance(args[1][0], CandidateInput)


@pytest.mark.asyncio
async def test_service_raises_job_not_found():
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.return_value = None

    service = AIRankingService(job_repository=mock_job_repo)

    with pytest.raises(JobNotFoundError):
        await service.get_ai_suggestions("missing-job")


@pytest.mark.asyncio
async def test_service_propagates_job_repository_error():
    mock_job_repo = MagicMock()
    mock_job_repo.get_job_by_id.side_effect = JobRepositoryError("db error")

    service = AIRankingService(job_repository=mock_job_repo)

    with pytest.raises(JobRepositoryError):
        await service.get_ai_suggestions("job-001")
