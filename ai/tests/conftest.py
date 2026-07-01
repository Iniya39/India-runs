import pytest
import os
from unittest.mock import patch, MagicMock
import numpy as np
from fastapi.testclient import TestClient

# Force environment variables before loading app modules
os.environ["AI_SERVICE_DEBUG"] = "True"

from app.main import app
from app.services import embedding_service


def _text_to_embedding(text: str) -> np.ndarray:
    """
    Deterministic embedding where texts sharing vocabulary tokens
    produce higher cosine similarity than unrelated texts.
    """
    vec = np.zeros(384, dtype=np.float32)
    for token in set(text.lower().split()):
        idx = hash(token) % 384
        vec[idx] += 1.0 + (hash(token) % 100) / 1000.0
    norm = np.linalg.norm(vec)
    if norm == 0:
        vec[0] = 1.0
        return vec
    return vec / norm


def _mock_encode(text_or_texts):
    if isinstance(text_or_texts, str):
        return _text_to_embedding(text_or_texts)
    return np.stack([_text_to_embedding(t) for t in text_or_texts])


@pytest.fixture(autouse=True)
def mock_sentence_transformer():
    """
    Mock SentenceTransformer initialization and encoding globally for unit tests,
    preventing any actual downloads or heavy CPU model loading during testing.
    """
    with patch("app.services.embedding.SentenceTransformer") as mock_class:
        mock_instance = MagicMock()
        mock_instance.encode.side_effect = _mock_encode
        mock_class.return_value = mock_instance
        yield mock_class

@pytest.fixture(autouse=True)
def reset_embedding_service_model():
    """
    Automatically reset the model state to None before each test, 
    and restore it afterward to keep tests isolated.
    """
    orig_model = embedding_service.model
    embedding_service.model = None
    yield
    embedding_service.model = orig_model


@pytest.fixture
def client():
    """Shared FastAPI test client with lifespan events enabled."""
    with TestClient(app) as test_client:
        yield test_client
