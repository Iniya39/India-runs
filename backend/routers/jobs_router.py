import logging

from fastapi import APIRouter, HTTPException, Query

from ai_client import AIServiceError
from repositories.candidate_repository import CandidateRepositoryError
from repositories.job_repository import JobRepositoryError
from schemas.ai_suggestions import AISuggestionsResponse
from services.ai_ranking_service import JobNotFoundError, ai_ranking_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Suggestions"])


@router.get(
    "/jobs/{job_id}/ai-suggestions",
    response_model=AISuggestionsResponse,
    summary="Get AI-ranked candidate suggestions for a job",
    responses={
        200: {"description": "Job loaded and candidates ranked successfully."},
        404: {"description": "Job not found."},
        503: {"description": "AI ranking service unavailable."},
        500: {"description": "Unexpected server error."},
    },
)
async def get_job_ai_suggestions(
    job_id: str,
    candidate_limit: int = Query(
        default=100,
        ge=1,
        le=500,
        description="Maximum number of active candidates to evaluate.",
    ),
) -> AISuggestionsResponse:
    """
    Retrieve a job posting and rank active candidates using the AI ranking microservice.

    Candidates are sorted by `final_score` in descending order.
    """
    if not job_id.strip():
        raise HTTPException(status_code=422, detail="job_id is required.")

    try:
        return await ai_ranking_service.get_ai_suggestions(
            job_id=job_id.strip(),
            candidate_limit=candidate_limit,
        )
    except JobNotFoundError:
        raise HTTPException(status_code=404, detail="Job not found.")
    except AIServiceError as exc:
        logger.error(
            "AI service unavailable for job suggestions",
            extra={"job_id": job_id, "error": exc.message},
        )
        raise HTTPException(status_code=503, detail=exc.message)
    except (JobRepositoryError, CandidateRepositoryError):
        logger.exception("Database error while generating AI suggestions", extra={"job_id": job_id})
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve data required for AI suggestions.",
        )
    except Exception:
        logger.exception("Unexpected error while generating AI suggestions", extra={"job_id": job_id})
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating AI suggestions.",
        )
