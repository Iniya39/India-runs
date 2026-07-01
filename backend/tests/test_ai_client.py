import json

import httpx
import pytest
import respx

from ai_client import (
    AIServiceClient,
    AIServiceError,
    CandidateInput,
)


@pytest.fixture
def ai_client() -> AIServiceClient:
    return AIServiceClient(
        base_url="http://ai-service.test",
        timeout_seconds=5.0,
        max_retries=3,
    )


@pytest.fixture
def sample_candidate() -> CandidateInput:
    return CandidateInput(
        candidate_id="cand-001",
        name="Priya Sharma",
        profile="Senior Python engineer with FastAPI and AWS experience.",
        skills=["Python", "FastAPI", "AWS"],
        projects=["Talent matching platform"],
        experience=6.0,
        certifications=["AWS Solutions Architect"],
        education="B.Tech in Computer Science",
    )


@respx.mock
@pytest.mark.asyncio
async def test_check_health_success(ai_client: AIServiceClient):
    respx.get("http://ai-service.test/health").mock(
        return_value=httpx.Response(
            200,
            json={
                "status": "healthy",
                "model_loaded": True,
                "model_name": "sentence-transformers/all-MiniLM-L6-v2",
                "cache_directory": "/cache",
                "timestamp": 1719878400.0,
            },
        )
    )

    result = await ai_client.check_health()

    assert result.is_healthy is True
    assert result.status == "healthy"
    assert result.model_loaded is True
    assert result.model_name == "sentence-transformers/all-MiniLM-L6-v2"


@respx.mock
@pytest.mark.asyncio
async def test_generate_embedding_success(ai_client: AIServiceClient):
    respx.post("http://ai-service.test/embed").mock(
        return_value=httpx.Response(
            200,
            json={
                "text": "Python developer",
                "embedding": [0.1, 0.2, 0.3],
                "dimensions": 3,
            },
        )
    )

    result = await ai_client.generate_embedding("Python developer")

    assert result.text == "Python developer"
    assert result.embedding == [0.1, 0.2, 0.3]
    assert result.dimensions == 3


@respx.mock
@pytest.mark.asyncio
async def test_compute_similarity_success(ai_client: AIServiceClient):
    respx.post("http://ai-service.test/similarity").mock(
        return_value=httpx.Response(200, json={"semantic_similarity": 88.16})
    )

    result = await ai_client.compute_similarity(
        "Senior Python developer with FastAPI experience.",
        "Python engineer with FastAPI and AWS experience.",
    )

    assert result.semantic_similarity == 88.16


@respx.mock
@pytest.mark.asyncio
async def test_rank_candidates_success(
    ai_client: AIServiceClient, sample_candidate: CandidateInput
):
    respx.post("http://ai-service.test/rank").mock(
        return_value=httpx.Response(
            200,
            json={
                "rankings": [
                    {
                        "candidate_id": "cand-001",
                        "name": "Priya Sharma",
                        "final_score": 83.82,
                        "semantic_similarity": 77.31,
                        "skills_match": 100.0,
                        "project_relevance": 60.19,
                        "experience_match": 100.0,
                        "certification_score": 100.0,
                        "education_score": 100.0,
                        "explanation": "Strong skill overlap and appropriate experience.",
                    }
                ]
            },
        )
    )

    result = await ai_client.rank_candidates(
        "Senior Python developer with FastAPI and AWS experience.",
        [sample_candidate],
    )

    assert len(result.rankings) == 1
    assert result.rankings[0].candidate_id == "cand-001"
    assert result.rankings[0].final_score == 83.82
    assert "skill overlap" in result.rankings[0].explanation.lower()


@respx.mock
@pytest.mark.asyncio
async def test_rank_candidates_accepts_dict_payload(
    ai_client: AIServiceClient, sample_candidate: CandidateInput
):
    route = respx.post("http://ai-service.test/rank").mock(
        return_value=httpx.Response(
            200,
            json={
                "rankings": [
                    {
                        "candidate_id": "cand-001",
                        "name": "Priya Sharma",
                        "final_score": 80.0,
                        "semantic_similarity": 75.0,
                        "skills_match": 90.0,
                        "project_relevance": 70.0,
                        "experience_match": 85.0,
                        "certification_score": 60.0,
                        "education_score": 65.0,
                        "explanation": "Good semantic alignment.",
                    }
                ]
            },
        )
    )

    await ai_client.rank_candidates(
        "Python developer role",
        [sample_candidate.model_dump()],
    )

    request = route.calls.last.request
    body = json.loads(request.content.decode())
    assert body["job_description"] == "Python developer role"
    assert body["candidates"][0]["candidate_id"] == "cand-001"


@respx.mock
@pytest.mark.asyncio
async def test_retry_on_service_unavailable(ai_client: AIServiceClient):
    route = respx.post("http://ai-service.test/similarity").mock(
        side_effect=[
            httpx.Response(503, json={"detail": "unavailable"}),
            httpx.Response(200, json={"semantic_similarity": 72.5}),
        ]
    )

    result = await ai_client.compute_similarity("Python role", "Python engineer")

    assert result.semantic_similarity == 72.5
    assert len(route.calls) == 2


@respx.mock
@pytest.mark.asyncio
async def test_timeout_raises_clean_error(ai_client: AIServiceClient):
    respx.post("http://ai-service.test/embed").mock(side_effect=httpx.ReadTimeout("timed out"))

    with pytest.raises(AIServiceError, match="temporarily unavailable"):
        await ai_client.generate_embedding("Python developer")


@respx.mock
@pytest.mark.asyncio
async def test_http_500_raises_clean_error_without_internal_details(
    ai_client: AIServiceClient,
):
    respx.post("http://ai-service.test/embed").mock(
        return_value=httpx.Response(500, json={"detail": "Internal model stack trace"})
    )

    with pytest.raises(AIServiceError) as exc_info:
        await ai_client.generate_embedding("Python developer")

    assert "stack trace" not in exc_info.value.message.lower()
    assert "AI service" in exc_info.value.message


@respx.mock
@pytest.mark.asyncio
async def test_validation_error_returns_clean_message(ai_client: AIServiceClient):
    respx.post("http://ai-service.test/rank").mock(
        return_value=httpx.Response(422, json={"detail": "validation failed"})
    )

    with pytest.raises(AIServiceError, match="invalid input"):
        await ai_client.rank_candidates("Job", [])


@respx.mock
@pytest.mark.asyncio
async def test_client_uses_configured_base_url():
    client = AIServiceClient(base_url="http://custom-ai:9000")
    route = respx.get("http://custom-ai:9000/health").mock(
        return_value=httpx.Response(200, json={"status": "healthy", "model_loaded": True})
    )

    await client.check_health()

    assert route.called
