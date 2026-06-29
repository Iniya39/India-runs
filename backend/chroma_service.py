import chromadb
from chromadb.config import Settings
import os

# Initialize ChromaDB client.
# In a real environment, you might connect to a persistent server.
# Here we use a local persistent directory inside the backend folder.
chroma_client = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "chroma_data"))

# Create or get a collection for jobs
collection_name = "jobs_semantic_search"
jobs_collection = chroma_client.get_or_create_collection(
    name=collection_name,
    metadata={"hnsw:space": "cosine"} # Cosine similarity works well for embeddings
)

def store_job_embedding(job_id: str, embedding: list[float], metadata: dict = None):
    """
    Stores the job's embedding and metadata in ChromaDB.
    Note: We do NOT store the full Job Description inside ChromaDB,
    only the job_id, embedding, and optional metadata references.
    """
    jobs_collection.upsert(
        ids=[job_id],
        embeddings=[embedding],
        metadatas=[metadata] if metadata else [{}]
    )

def search_similar_jobs(query_embedding: list[float], n_results: int = 5):
    """
    Example search function (for future use).
    """
    results = jobs_collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    return results

# --- Candidates Collection ---
candidates_collection_name = "candidates_semantic_search"
candidates_collection = chroma_client.get_or_create_collection(
    name=candidates_collection_name,
    metadata={"hnsw:space": "cosine"}
)

def store_candidate_embedding(candidate_id: str, embedding: list[float], metadata: dict = None):
    """
    Stores the candidate's embedding and metadata in ChromaDB.
    """
    candidates_collection.upsert(
        ids=[candidate_id],
        embeddings=[embedding],
        metadatas=[metadata] if metadata else [{}]
    )

def search_candidates_in_chroma(query_embedding: list[float], filter_ids: list[str] = None, n_results: int = 100):
    """
    Search candidate embeddings. If filter_ids is provided, strictly filters by those IDs (Elasticsearch candidates).
    """
    where_clause = None
    if filter_ids is not None:
        if len(filter_ids) == 0:
            return {"ids": [], "distances": []} # No candidates from ES
        elif len(filter_ids) == 1:
            where_clause = {"id": filter_ids[0]}
        else:
            where_clause = {"id": {"$in": filter_ids}}
            
    results = candidates_collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where_clause
    )
    return results
