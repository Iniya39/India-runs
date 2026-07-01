"""
Async HTTP client for the TalentSphere AI microservice.

Communicates with the public REST APIs:
  - GET  /health
  - POST /embed
  - POST /similarity
  - POST /rank
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any

import httpx
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

DEFAULT_AI_SERVICE_URL = "http://localhost:8001"
DEFAULT_TIMEOUT_SECONDS = 30.0
DEFAULT_MAX_RETRIES = 3
RETRYABLE_STATUS_CODES = frozenset({429, 502, 503, 504})
RETRY_BACKOFF_SECONDS = 0.5


class AIServiceError(Exception):
    """Raised when the AI microservice cannot fulfill a request."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class HealthResult(BaseModel):
    status: str
    model_loaded: bool
    model_name: str | None = None
    cache_directory: str | None = None
    timestamp: float | None = None

    @property
    def is_healthy(self) -> bool:
        return self.status == "healthy" and self.model_loaded


class EmbeddingResult(BaseModel):
    text: str
    embedding: list[float]
    dimensions: int


class SimilarityResult(BaseModel):
    semantic_similarity: float = Field(ge=0, le=100)


class CandidateInput(BaseModel):
    candidate_id: str = Field(min_length=1)
    name: str
    profile: str
    skills: list[str]
    projects: list[str]
    experience: float = Field(ge=0)
    certifications: list[str]
    education: str


class RankedCandidateResult(BaseModel):
    candidate_id: str
    name: str
    final_score: float = Field(ge=0, le=100)
    semantic_similarity: float = Field(ge=0, le=100)
    skills_match: float = Field(ge=0, le=100)
    project_relevance: float = Field(ge=0, le=100)
    experience_match: float = Field(ge=0, le=100)
    certification_score: float = Field(ge=0, le=100)
    education_score: float = Field(ge=0, le=100)
    explanation: str


class RankingResult(BaseModel):
    rankings: list[RankedCandidateResult]


class AIServiceClient:
    """Reusable async client for the AI ranking microservice."""

    def __init__(
        self,
        base_url: str | None = None,
        timeout_seconds: float | None = None,
        max_retries: int | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("AI_SERVICE_URL", DEFAULT_AI_SERVICE_URL)).rstrip(
            "/"
        )
        self.timeout_seconds = float(
            timeout_seconds or os.getenv("AI_SERVICE_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS)
        )
        self.max_retries = int(
            max_retries or os.getenv("AI_SERVICE_MAX_RETRIES", DEFAULT_MAX_RETRIES)
        )
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> AIServiceClient:
        return self

    async def __aexit__(self, *_args: object) -> None:
        await self.close()

    async def close(self) -> None:
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
        self._client = None

    async def check_health(self) -> HealthResult:
        """Check AI microservice health and model load status."""
        data = await self._request("GET", "/health")
        return HealthResult.model_validate(data)

    async def generate_embedding(self, text: str) -> EmbeddingResult:
        """Generate a semantic embedding vector for the given text."""
        data = await self._request("POST", "/embed", json={"text": text})
        return EmbeddingResult.model_validate(data)

    async def compute_similarity(
        self, job_description: str, candidate_profile: str
    ) -> SimilarityResult:
        """Compute semantic similarity between a job description and candidate profile."""
        data = await self._request(
            "POST",
            "/similarity",
            json={
                "job_description": job_description,
                "candidate_profile": candidate_profile,
            },
        )
        return SimilarityResult.model_validate(data)

    async def rank_candidates(
        self,
        job_description: str,
        candidates: list[CandidateInput | dict[str, Any]],
    ) -> RankingResult:
        """Rank candidates against a job description using hybrid scoring."""
        payload_candidates = [
            candidate.model_dump() if isinstance(candidate, CandidateInput) else candidate
            for candidate in candidates
        ]
        data = await self._request(
            "POST",
            "/rank",
            json={
                "job_description": job_description,
                "candidates": payload_candidates,
            },
        )
        return RankingResult.model_validate(data)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout_seconds),
            )
        return self._client

    async def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        last_error: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            started_at = time.perf_counter()
            logger.info(
                "AI service request started",
                extra={"method": method, "path": path, "attempt": attempt},
            )

            try:
                client = await self._get_client()
                response = await client.request(method, path, **kwargs)
                elapsed_ms = (time.perf_counter() - started_at) * 1000

                logger.info(
                    "AI service request completed",
                    extra={
                        "method": method,
                        "path": path,
                        "status_code": response.status_code,
                        "response_time_ms": round(elapsed_ms, 2),
                        "attempt": attempt,
                    },
                )

                if (
                    response.status_code in RETRYABLE_STATUS_CODES
                    and attempt < self.max_retries
                ):
                    logger.warning(
                        "AI service returned retryable status",
                        extra={
                            "method": method,
                            "path": path,
                            "status_code": response.status_code,
                            "attempt": attempt,
                        },
                    )
                    await asyncio.sleep(RETRY_BACKOFF_SECONDS * attempt)
                    continue

                if response.status_code >= 400:
                    logger.error(
                        "AI service request failed",
                        extra={
                            "method": method,
                            "path": path,
                            "status_code": response.status_code,
                            "attempt": attempt,
                        },
                    )
                    raise AIServiceError(_public_error_message(response.status_code))

                return response.json()

            except AIServiceError:
                raise
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.error(
                    "AI service request timed out",
                    extra={"method": method, "path": path, "attempt": attempt},
                )
            except httpx.RequestError as exc:
                last_error = exc
                logger.error(
                    "AI service request error",
                    extra={
                        "method": method,
                        "path": path,
                        "attempt": attempt,
                        "error": str(exc),
                    },
                )

            if attempt < self.max_retries:
                await asyncio.sleep(RETRY_BACKOFF_SECONDS * attempt)

        logger.error(
            "AI service request exhausted retries",
            extra={"method": method, "path": path, "error": str(last_error)},
        )
        raise AIServiceError(
            "The AI service is temporarily unavailable. Please try again later."
        )


def _public_error_message(status_code: int) -> str:
    if status_code == 404:
        return "The requested AI service endpoint was not found."
    if status_code == 422:
        return "The AI service could not process the request due to invalid input."
    if status_code == 503:
        return "The AI service is currently unavailable."
    if status_code >= 500:
        return "The AI service encountered an error while processing the request."
    return "The AI service rejected the request."


ai_service_client = AIServiceClient()
