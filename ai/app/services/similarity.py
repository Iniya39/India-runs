import logging
from app.services.embedding import embedding_service

logger = logging.getLogger("ai_service")


class SimilarityService:
    def compute_similarity(self, job_description: str, candidate_profile: str) -> float:
        """
        Generates embeddings using the existing embedding service,
        computes cosine similarity, and normalizes the score to a [0.0, 100.0] percentage.
        """
        if embedding_service.model is None:
            logger.warning("Embedding model not loaded; loading on-demand for similarity request")
            embedding_service.load_model()

        logger.info(
            "Computing semantic similarity",
            extra={
                "job_description_length": len(job_description),
                "candidate_profile_length": len(candidate_profile),
            },
        )

        embeddings = embedding_service.generate_embeddings_batch(
            [job_description, candidate_profile]
        )
        emb1, emb2 = embeddings[0], embeddings[1]

        similarity = embedding_service.compute_cosine_similarity(emb1, emb2)
        match_percentage = float(max(0.0, min(1.0, similarity)) * 100.0)
        score = round(match_percentage, 2)

        logger.info(
            "Semantic similarity computed",
            extra={"raw_cosine_similarity": similarity, "semantic_similarity": score},
        )
        return score


similarity_service = SimilarityService()
