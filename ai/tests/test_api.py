import pytest
from app.services import embedding_service


def test_health_check(client):
    """
    Test GET /health endpoint to ensure it returns healthy state when model is loaded.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "model_name" in data

def test_embed_valid_input(client):
    """
    Test POST /embed with valid text.
    """
    payload = {"text": "Python developer with Spring Boot experience"}
    response = client.post("/embed", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == payload["text"]
    assert isinstance(data["embedding"], list)
    assert len(data["embedding"]) == 384
    assert data["dimensions"] == 384

def test_embed_empty_text(client):
    """
    Test POST /embed with empty text (should fail validation).
    """
    payload = {"text": ""}
    response = client.post("/embed", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()

def test_embed_missing_text(client):
    """
    Test POST /embed with missing text field.
    """
    payload = {}
    response = client.post("/embed", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()

def test_embed_invalid_json_payload(client):
    """
    Test POST /embed with invalid JSON format.
    """
    response = client.post(
        "/embed",
        content="invalid json string",
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422

def test_embed_large_text_input(client):
    """
    Test POST /embed with very large text input.
    """
    large_text = "developer " * 5000  # 50,000 characters
    payload = {"text": large_text}
    response = client.post("/embed", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == large_text
    assert len(data["embedding"]) == 384

def test_embed_unicode_and_special_characters(client):
    """
    Test POST /embed with unicode and special characters.
    """
    special_text = "Python 🐍 开发 🚀 & * # @ ($%^)"
    payload = {"text": special_text}
    response = client.post("/embed", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == special_text
    assert len(data["embedding"]) == 384

def test_model_loaded_only_once(mock_sentence_transformer):
    """
    Verify that the SentenceTransformer is loaded only once by the service,
    even if load_model() is called multiple times.
    """
    # Reset model to None to force a fresh load
    embedding_service.model = None
    
    # Call load_model multiple times
    embedding_service.load_model()
    embedding_service.load_model()
    embedding_service.load_model()
    
    # Verify that the mock constructor was called exactly once
    mock_sentence_transformer.assert_called_once()


# --- POST /similarity ---

SIMILARITY_JOB = (
    "Senior Python developer with 5+ years of experience in FastAPI, "
    "machine learning, and cloud deployment on AWS."
)
SIMILARITY_CANDIDATE_MATCH = (
    "Experienced Python engineer skilled in FastAPI, ML pipelines, "
    "and AWS infrastructure with 6 years in backend development."
)
SIMILARITY_CANDIDATE_UNRELATED = (
    "Professional pastry chef specializing in French desserts, "
    "sourdough baking, and restaurant kitchen management."
)


def test_similarity_valid_request(client):
    """Test POST /similarity with a valid job description and candidate profile."""
    payload = {
        "job_description": SIMILARITY_JOB,
        "candidate_profile": SIMILARITY_CANDIDATE_MATCH,
    }
    response = client.post("/similarity", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "semantic_similarity" in data
    score = data["semantic_similarity"]
    assert isinstance(score, float)
    assert 0.0 <= score <= 100.0


def test_similarity_identical_text(client):
    """Identical job description and profile should yield maximum similarity."""
    text = "Python developer with FastAPI and AWS experience."
    payload = {"job_description": text, "candidate_profile": text}
    response = client.post("/similarity", json=payload)
    assert response.status_code == 200
    assert response.json()["semantic_similarity"] == 100.0


def test_similarity_unrelated_text(client):
    """Unrelated texts should yield a lower similarity than a strong match."""
    match_response = client.post(
        "/similarity",
        json={
            "job_description": SIMILARITY_JOB,
            "candidate_profile": SIMILARITY_CANDIDATE_MATCH,
        },
    )
    unrelated_response = client.post(
        "/similarity",
        json={
            "job_description": SIMILARITY_JOB,
            "candidate_profile": SIMILARITY_CANDIDATE_UNRELATED,
        },
    )
    assert match_response.status_code == 200
    assert unrelated_response.status_code == 200
    match_score = match_response.json()["semantic_similarity"]
    unrelated_score = unrelated_response.json()["semantic_similarity"]
    assert match_score > unrelated_score
    assert unrelated_score < 100.0


def test_similarity_empty_job_description(client):
    """Empty job description should fail validation."""
    payload = {"job_description": "", "candidate_profile": "Some profile text."}
    response = client.post("/similarity", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()


def test_similarity_empty_candidate_profile(client):
    """Empty candidate profile should fail validation."""
    payload = {"job_description": "Some job description.", "candidate_profile": ""}
    response = client.post("/similarity", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()


def test_similarity_missing_job_description(client):
    """Missing job_description field should fail validation."""
    payload = {"candidate_profile": "Some profile text."}
    response = client.post("/similarity", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()


def test_similarity_missing_candidate_profile(client):
    """Missing candidate_profile field should fail validation."""
    payload = {"job_description": "Some job description."}
    response = client.post("/similarity", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()


def test_similarity_invalid_json(client):
    """Invalid JSON body should return 422."""
    response = client.post(
        "/similarity",
        content="not valid json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


def test_similarity_response_schema(client):
    """Response must match SemanticSimilarityResponse schema."""
    payload = {
        "job_description": SIMILARITY_JOB,
        "candidate_profile": SIMILARITY_CANDIDATE_MATCH,
    }
    response = client.post("/similarity", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"semantic_similarity"}
    assert isinstance(data["semantic_similarity"], (int, float))


def test_similarity_does_not_reload_model(client, mock_sentence_transformer):
    """Multiple similarity requests must reuse the loaded model, not reload it."""
    mock_sentence_transformer.reset_mock()
    embedding_service.model = None
    embedding_service.load_model()

    payload = {
        "job_description": SIMILARITY_JOB,
        "candidate_profile": SIMILARITY_CANDIDATE_MATCH,
    }
    for _ in range(3):
        response = client.post("/similarity", json=payload)
        assert response.status_code == 200

    mock_sentence_transformer.assert_called_once()
