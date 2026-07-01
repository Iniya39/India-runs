import pytest

from app.schemas.ranking import RankingResponse
from app.services import embedding_service
from app.services.ranking import DEFAULT_RANKING_WEIGHTS
from tests.ranking_helpers import (
    JOB_DESCRIPTION,
    MODERATE_CANDIDATE,
    STRONG_CANDIDATE,
    WEAK_CANDIDATE,
    assert_ranking_response_valid,
    generate_candidate_batch,
    ranking_payload,
)


def test_rank_valid_multi_candidate_request_ordered(client):
    payload = ranking_payload(
        candidates=[WEAK_CANDIDATE, MODERATE_CANDIDATE, STRONG_CANDIDATE]
    )
    response = client.post("/rank", json=payload)
    assert response.status_code == 200

    data = response.json()
    result = assert_ranking_response_valid(data)
    assert len(result.rankings) == 3
    assert result.rankings[0].candidate_id == "cand-strong"
    assert result.rankings[-1].candidate_id == "cand-weak"
    assert result.rankings[0].final_score > result.rankings[-1].final_score


def test_rank_single_candidate_request(client):
    payload = ranking_payload(candidates=[STRONG_CANDIDATE])
    response = client.post("/rank", json=payload)
    assert response.status_code == 200

    result = assert_ranking_response_valid(response.json())
    assert len(result.rankings) == 1
    assert result.rankings[0].candidate_id == "cand-strong"


@pytest.mark.parametrize("candidate_count", [50, 100])
def test_rank_large_candidate_list(client, candidate_count):
    payload = ranking_payload(candidates=generate_candidate_batch(candidate_count))
    response = client.post("/rank", json=payload)
    assert response.status_code == 200

    result = assert_ranking_response_valid(response.json())
    assert len(result.rankings) == candidate_count


def test_rank_empty_candidates_returns_validation_error(client):
    response = client.post("/rank", json=ranking_payload(candidates=[]))
    assert response.status_code == 422
    assert "detail" in response.json()


def test_rank_empty_job_description_returns_validation_error(client):
    response = client.post(
        "/rank",
        json=ranking_payload(job_description="", candidates=[STRONG_CANDIDATE]),
    )
    assert response.status_code == 422
    assert "detail" in response.json()


def test_rank_invalid_json_returns_validation_error(client):
    response = client.post(
        "/rank",
        content="not valid json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


def test_rank_missing_required_fields_returns_validation_error(client):
    response = client.post("/rank", json={"job_description": JOB_DESCRIPTION})
    assert response.status_code == 422


@pytest.mark.parametrize(
    "invalid_payload",
    [
        {
            "job_description": JOB_DESCRIPTION,
            "candidates": [
                {
                    **STRONG_CANDIDATE,
                    "experience": "six years",
                }
            ],
        },
        {
            "job_description": JOB_DESCRIPTION,
            "candidates": [
                {
                    **STRONG_CANDIDATE,
                    "skills": "Python, FastAPI",
                }
            ],
        },
        {
            "job_description": JOB_DESCRIPTION,
            "candidates": [
                {
                    **STRONG_CANDIDATE,
                    "candidate_id": "",
                }
            ],
        },
    ],
)
def test_rank_invalid_data_types_return_validation_error(client, invalid_payload):
    response = client.post("/rank", json=invalid_payload)
    assert response.status_code == 422


def test_rank_unicode_job_description_and_profiles(client):
    payload = ranking_payload(
        job_description=(
            "Senior Python développeur 🚀 with FastAPI, 机器学习, and AWS experience."
        ),
        candidates=[
            {
                **STRONG_CANDIDATE,
                "candidate_id": "cand-unicode",
                "name": "李明",
                "profile": "Python engineer with FastAPI, 机器学习, and ☁️ AWS experience.",
                "skills": ["Python", "FastAPI", "机器学习"],
                "projects": ["AI platform with Python 🐍 and FastAPI"],
                "education": "计算机科学学士",
            }
        ],
    )
    response = client.post("/rank", json=payload)
    assert response.status_code == 200
    assert_ranking_response_valid(response.json())


def test_rank_very_large_job_description(client):
    large_job_description = (JOB_DESCRIPTION + " ") * 5000
    payload = ranking_payload(
        job_description=large_job_description,
        candidates=[STRONG_CANDIDATE, WEAK_CANDIDATE],
    )
    response = client.post("/rank", json=payload)
    assert response.status_code == 200
    assert_ranking_response_valid(response.json())


def test_rank_response_matches_ranking_response_schema(client):
    payload = ranking_payload(
        candidates=[STRONG_CANDIDATE, MODERATE_CANDIDATE, WEAK_CANDIDATE]
    )
    response = client.post("/rank", json=payload)
    assert response.status_code == 200

    parsed = RankingResponse.model_validate(response.json())
    assert len(parsed.rankings) == 3
    for ranked in parsed.rankings:
        assert ranked.explanation.endswith(".")


def test_rank_all_score_fields_within_bounds(client):
    payload = ranking_payload(
        candidates=[STRONG_CANDIDATE, MODERATE_CANDIDATE, WEAK_CANDIDATE]
    )
    response = client.post("/rank", json=payload)
    assert response.status_code == 200

    assert_ranking_response_valid(response.json())


def test_rank_final_score_follows_weight_formula(client):
    payload = ranking_payload(
        candidates=[STRONG_CANDIDATE, MODERATE_CANDIDATE, WEAK_CANDIDATE]
    )
    response = client.post("/rank", json=payload)
    assert response.status_code == 200

    for ranked in response.json()["rankings"]:
        expected = round(
            sum(
                DEFAULT_RANKING_WEIGHTS[field] * ranked[field]
                for field in DEFAULT_RANKING_WEIGHTS
            ),
            2,
        )
        assert ranked["final_score"] == expected


def test_rank_explanations_are_present_and_deterministic(client):
    payload = ranking_payload(
        candidates=[STRONG_CANDIDATE, MODERATE_CANDIDATE, WEAK_CANDIDATE]
    )

    first = client.post("/rank", json=payload)
    second = client.post("/rank", json=payload)
    assert first.status_code == 200
    assert second.status_code == 200

    first_explanations = [item["explanation"] for item in first.json()["rankings"]]
    second_explanations = [item["explanation"] for item in second.json()["rankings"]]
    assert first_explanations == second_explanations
    assert all(explanation.endswith(".") for explanation in first_explanations)


def test_rank_endpoint_in_openapi(client):
    schema = client.get("/openapi.json").json()
    assert "/rank" in schema["paths"]
    post_op = schema["paths"]["/rank"]["post"]
    assert post_op["requestBody"]["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/RankingRequest"
    )
    assert post_op["responses"]["200"]["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/RankingResponse"
    )


def test_rank_model_loaded_once_across_multiple_requests(client, mock_sentence_transformer):
    mock_sentence_transformer.reset_mock()
    embedding_service.model = None

    payload = ranking_payload(candidates=generate_candidate_batch(25))
    for _ in range(5):
        response = client.post("/rank", json=payload)
        assert response.status_code == 200
        assert_ranking_response_valid(response.json())

    mock_sentence_transformer.assert_called_once()


def test_rank_large_batch_without_repeated_model_loading(
    client, mock_sentence_transformer
):
    mock_sentence_transformer.reset_mock()
    embedding_service.model = None

    payload = ranking_payload(candidates=generate_candidate_batch(75))
    response = client.post("/rank", json=payload)
    assert response.status_code == 200

    result = assert_ranking_response_valid(response.json())
    assert len(result.rankings) == 75
    mock_sentence_transformer.assert_called_once()
