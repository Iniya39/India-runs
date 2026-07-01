import logging
import time
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.services import embedding_service
from app.schemas import (
    EmbeddingRequest,
    EmbeddingResponse,
    BatchEmbeddingRequest,
    BatchEmbeddingResponse,
    SimilarityRequest,
    SimilarityResponse,
)


# Configure logging
logging.basicConfig(
    level=logging.INFO if not config.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the sentence-transformers model
    logger.info("Starting up AI microservice...")
    logger.info(f"Using model: {config.MODEL_NAME}")
    start_time = time.time()
    try:
        embedding_service.load_model()
        logger.info(f"Model loaded successfully in {time.time() - start_time:.2f} seconds.")
    except Exception as e:
        logger.error(f"Critical error on startup: failed to load model. {e}")
        # We don't crash the server hard to allow diagnostic /health page to load,
        # but mark the service unhealthy.
    yield
    # Shutdown
    logger.info("Shutting down AI microservice...")

app = FastAPI(
    title="TalentSphere AI Semantic Service",
    description="Microservice for generating sentence embeddings and semantic ranking using sentence-transformers/all-MiniLM-L6-v2.",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware to allow cross-origin requests from frontend and node backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify that the service is running
    and the embedding model has loaded successfully.
    """
    model_loaded = embedding_service.model is not None
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "model_name": config.MODEL_NAME,
        "cache_directory": config.HF_HOME,
        "timestamp": time.time(),
    }

@app.post("/api/embeddings", response_model=EmbeddingResponse)
async def generate_single_embedding(payload: EmbeddingRequest):
    """
    Generate a 384-dimensional semantic embedding vector for a single text string.
    """
    try:
        embedding = embedding_service.generate_embedding(payload.text)
        return EmbeddingResponse(
            text=payload.text,
            embedding=embedding,
            dimensions=len(embedding)
        )
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate embedding: {str(e)}"
        )

@app.post("/embed", response_model=EmbeddingResponse)
async def generate_embed(payload: EmbeddingRequest):
    """
    Generate a semantic embedding vector for a single text string.
    This endpoint offloads the CPU-bound embedding generation to a separate thread
    to prevent blocking the FastAPI event loop.
    """
    try:
        # Offload CPU-bound inference to a thread pool
        embedding = await asyncio.to_thread(embedding_service.generate_embedding, payload.text)
        return EmbeddingResponse(
            text=payload.text,
            embedding=embedding,
            dimensions=len(embedding)
        )
    except Exception as e:
        logger.error(f"Error generating embedding for /embed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate embedding: {str(e)}"
        )

@app.post("/api/embeddings/batch", response_model=BatchEmbeddingResponse)
async def generate_batch_embeddings(payload: BatchEmbeddingRequest):
    """
    Generate semantic embedding vectors for a list of text strings in batch.
    """
    if not payload.texts:
        raise HTTPException(
            status_code=400,
            detail="Payload must contain at least one text string in 'texts'."
        )
    try:
        embeddings = embedding_service.generate_embeddings_batch(payload.texts)
        dimensions = len(embeddings[0]) if embeddings else 0
        return BatchEmbeddingResponse(
            texts=payload.texts,
            embeddings=embeddings,
            dimensions=dimensions
        )
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate batch embeddings: {str(e)}"
        )

@app.post("/api/semantic-similarity", response_model=SimilarityResponse)
async def semantic_similarity(payload: SimilarityRequest):
    """
    Compute semantic similarity and match percentage between a job description and a candidate profile.
    """
    try:
        result = embedding_service.compute_similarity_for_texts(
            payload.job_description,
            payload.candidate_profile
        )
        return SimilarityResponse(
            job_description=payload.job_description,
            candidate_profile=payload.candidate_profile,
            similarity_score=result["similarity_score"],
            match_percentage=result["match_percentage"],
            dimensions=result["dimensions"],
            model_name=config.MODEL_NAME,
            processing_time_ms=result["processing_time_ms"]
        )
    except Exception as e:
        logger.error(f"Error computing semantic similarity: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute semantic similarity: {str(e)}"
        )

