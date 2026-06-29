from chroma_service import search_candidates_in_chroma
from embedding_service import generate_embedding

def perform_semantic_search(semantic_text: str, candidate_ids: list[str] = None, top_k: int = 100):
    """
    Embeds the semantic text and searches ChromaDB within the given candidate IDs.
    Returns a list of candidate dictionaries with their IDs and similarity scores.
    """
    try:
        query_embedding = generate_embedding(semantic_text)
        
        results = search_candidates_in_chroma(
            query_embedding=query_embedding,
            filter_ids=candidate_ids,
            n_results=top_k
        )
        
        candidates = []
        if results and "ids" in results and results["ids"] and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                c_id = results["ids"][0][i]
                # Chroma returns distance, lower is more similar.
                # Cosine distance to similarity: similarity = 1 - distance
                distance = results["distances"][0][i]
                similarity_pct = max(0, min(100, int((1 - distance) * 100)))
                
                candidates.append({
                    "candidate_id": c_id,
                    "similarity_score": similarity_pct,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {}
                })
                
        return candidates
    except Exception as e:
        print(f"Semantic search failed: {e}")
        return []
