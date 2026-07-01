import logging
import time
from typing import Any

from ai_client import AIServiceClient, AIServiceError, CandidateInput, RankingResult, ai_service_client
from models.candidate import CandidateProfile
from models.job import JobPosting
from repositories.candidate_repository import CandidateRepository, CandidateRepositoryError
from repositories.job_repository import JobRepository, JobRepositoryError
from schemas.ai_suggestions import AISuggestionsResponse, JobSummaryResponse

logger = logging.getLogger(__name__)


class JobNotFoundError(Exception):
    """Raised when a job posting cannot be found."""


class AIRankingService:
    def __init__(
        self,
        job_repository: JobRepository | None = None,
        candidate_repository: CandidateRepository | None = None,
        ai_client: AIServiceClient | None = None,
    ) -> None:
        self._job_repository = job_repository or JobRepository()
        self._candidate_repository = candidate_repository or CandidateRepository()
        self._ai_client = ai_client or ai_service_client

    async def get_ai_suggestions(
        self,
        job_id: str,
        candidate_limit: int = 100,
    ) -> AISuggestionsResponse:
        started_at = time.perf_counter()
        logger.info("AI suggestions request started", extra={"job_id": job_id})

        job = self._load_job(job_id)
        logger.info(
            "Job loaded for AI suggestions",
            extra={"job_id": job.job_id, "title_length": len(job.title)},
        )

        candidates = self._load_candidates(candidate_limit)
        logger.info(
            "Candidates loaded for AI suggestions",
            extra={"job_id": job.job_id, "candidate_count": len(candidates)},
        )

        rankings: list = []
        if candidates:
            logger.info(
                "AI ranking request started",
                extra={"job_id": job.job_id, "candidate_count": len(candidates)},
            )
            ranking_result = await self._rank_with_ai(job, candidates)
            rankings = ranking_result.rankings
            logger.info(
                "AI ranking response received",
                extra={
                    "job_id": job.job_id,
                    "ranked_count": len(rankings),
                },
            )
        else:
            logger.info(
                "Skipping AI ranking because no active candidates were found",
                extra={"job_id": job.job_id},
            )

        elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
        logger.info(
            "AI suggestions request completed",
            extra={
                "job_id": job.job_id,
                "candidate_count": len(candidates),
                "ranked_count": len(rankings),
                "elapsed_ms": elapsed_ms,
            },
        )

        return AISuggestionsResponse(
            job=self._to_job_summary(job),
            rankings=rankings,
            candidate_count=len(candidates),
            elapsed_ms=elapsed_ms,
        )

    def _load_job(self, job_id: str) -> JobPosting:
        try:
            job = self._job_repository.get_job_by_id(job_id)
        except JobRepositoryError as exc:
            raise exc
        if job is None:
            raise JobNotFoundError(f"Job not found: {job_id}")
        return job

    def _load_candidates(self, candidate_limit: int) -> list[CandidateProfile]:
        try:
            return self._candidate_repository.get_active_candidates(limit=candidate_limit)
        except CandidateRepositoryError as exc:
            raise exc

    async def _rank_with_ai(
        self,
        job: JobPosting,
        candidates: list[CandidateProfile],
    ) -> RankingResult:
        try:
            return await self._ai_client.rank_candidates(
                job.build_ranking_description(),
                [self._to_candidate_input(candidate) for candidate in candidates],
            )
        except AIServiceError as exc:
            raise exc

    @staticmethod
    def _to_candidate_input(candidate: CandidateProfile) -> CandidateInput:
        return CandidateInput(
            candidate_id=candidate.candidate_id,
            name=candidate.full_name,
            profile=candidate.profile_summary or candidate.full_name,
            skills=candidate.skills,
            projects=candidate.projects,
            experience=candidate.years_of_experience,
            certifications=candidate.certifications,
            education=candidate.education,
        )

    @staticmethod
    def _to_job_summary(job: JobPosting) -> JobSummaryResponse:
        return JobSummaryResponse(
            job_id=job.job_id,
            title=job.title,
            description=job.build_ranking_description(),
            required_skills=job.required_skills,
            required_experience=job.required_experience,
            education=job.education,
            certifications=job.certifications,
        )


ai_ranking_service = AIRankingService()
