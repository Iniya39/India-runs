import time
from functools import lru_cache
from query_parser import parse_search_query
from elastic_filter import filter_candidates
from semantic_search import perform_semantic_search

# Optional cache for semantic search texts to avoid re-embedding the exact same query intent
# In a production app, we'd cache the embeddings themselves, but LRU cache on the function works here.
@lru_cache(maxsize=100)
def cached_semantic_search(semantic_text: str, candidate_ids_tuple: tuple, top_k: int):
    # Candidate IDs must be a tuple to be hashable for lru_cache
    candidate_ids = list(candidate_ids_tuple) if candidate_ids_tuple else None
    return perform_semantic_search(semantic_text, candidate_ids, top_k)

def retrieve_candidates(raw_query: str, filters: dict = None):
    """
    Orchestrates the hybrid candidate retrieval flow.
    1. AI Query Parsing
    2. Elasticsearch Filtering
    3. ChromaDB Semantic Search
    """
    start_time = time.time()
    
    # 1. AI Query Parsing (combining raw query and strict UI filters if any)
    combined_query = raw_query
    if filters:
        for k, v in filters.items():
            if v and str(v).lower() != "all":
                combined_query += f" | {k}: {v}"
                
    parsed_query = parse_search_query(combined_query)
    query_understanding_time = time.time() - start_time
    
    # 2. Elasticsearch Filtering
    es_start = time.time()
    es_candidate_ids = filter_candidates(parsed_query)
    es_time = time.time() - es_start
    
    # 3. ChromaDB Semantic Search
    chroma_start = time.time()
    semantic_text = parsed_query.get("semanticSearchText", raw_query)
    
    # Convert list to tuple for caching
    ids_tuple = tuple(es_candidate_ids) if es_candidate_ids is not None else None
    
    semantic_candidates = cached_semantic_search(semantic_text, ids_tuple, top_k=100)
    chroma_time = time.time() - chroma_start
    
    total_time = time.time() - start_time
    
    # Format the response
    return {
        "candidates": semantic_candidates,
        "analytics": {
            "total_time_ms": int(total_time * 1000),
            "es_time_ms": int(es_time * 1000),
            "chroma_time_ms": int(chroma_time * 1000),
            "query_parsing_ms": int(query_understanding_time * 1000),
            "es_candidates_found": len(es_candidate_ids) if es_candidate_ids is not None else "Fallback (All)",
            "final_candidates_returned": len(semantic_candidates)
        },
        "parsed_query": parsed_query
    }
