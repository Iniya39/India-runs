from pydantic import BaseModel, Field

class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="The text string to generate an embedding for.", min_length=1)

class EmbeddingResponse(BaseModel):
    text: str = Field(..., description="The original input text.")
    embedding: list[float] = Field(..., description="The computed 384-dimensional vector embedding.")
    dimensions: int = Field(..., description="Dimension of the generated vector (e.g. 384 for MiniLM-L6-v2).")

class BatchEmbeddingRequest(BaseModel):
    texts: list[str] = Field(..., description="A list of text strings to generate embeddings for.")

class BatchEmbeddingResponse(BaseModel):
    texts: list[str] = Field(..., description="The original input texts.")
    embeddings: list[list[float]] = Field(..., description="List of computed vector embeddings.")
    dimensions: int = Field(..., description="Dimension of the generated vectors.")

class SimilarityRequest(BaseModel):
    job_description: str = Field(..., description="The reference job description text.", min_length=1)
    candidate_profile: str = Field(..., description="The candidate profile text to compare.", min_length=1)

class SimilarityResponse(BaseModel):
    job_description: str = Field(..., description="The original input job description.")
    candidate_profile: str = Field(..., description="The original input candidate profile.")
    similarity_score: float = Field(..., description="The raw cosine similarity score (typically between -1.0 and 1.0).")
    match_percentage: float = Field(..., description="The normalized similarity score scaled to a 0.0 - 100.0 percentage.")
    dimensions: int = Field(..., description="Dimension of the vectors compared (e.g. 384).")
    model_name: str = Field(..., description="The model name used to generate embeddings.")
    processing_time_ms: float = Field(..., description="The time taken to generate embeddings and compute similarity, in milliseconds.")

class SemanticSimilarityRequest(BaseModel):
    job_description: str = Field(..., description="The reference job description text.", min_length=1)
    candidate_profile: str = Field(..., description="The candidate profile text to compare.", min_length=1)

class SemanticSimilarityResponse(BaseModel):
    semantic_similarity: float = Field(..., description="The normalized similarity score scaled to a 0.0 - 100.0 percentage.")

