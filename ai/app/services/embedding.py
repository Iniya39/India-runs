import logging
from sentence_transformers import SentenceTransformer
from app import config

logger = logging.getLogger("ai_service")

class EmbeddingService:
    def __init__(self):
        self.model = None

    def load_model(self) -> None:
        """
        Loads the SentenceTransformer model from local cache or downloads it.
        """
        if self.model is not None:
            return

        logger.info(f"Loading/Downloading embedding model: '{config.MODEL_NAME}'")
        logger.info(f"Model cache folder: {config.HF_HOME}")
        
        try:
            # SentenceTransformer downloads the model if not cached and saves it in HF_HOME
            self.model = SentenceTransformer(config.MODEL_NAME)
            logger.info("Embedding model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise e

    def generate_embedding(self, text: str) -> list[float]:
        """
        Generates a vector embedding for a single text input.
        """
        if self.model is None:
            logger.warning("Embedding model was not loaded. Loading now on-demand...")
            self.load_model()
        
        embedding_array = self.model.encode(text)
        # Convert numpy array to list of floats for JSON serialization
        return embedding_array.tolist()

    def generate_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generates vector embeddings for a batch of text inputs.
        """
        if self.model is None:
            logger.warning("Embedding model was not loaded. Loading now on-demand...")
            self.load_model()
            
        embeddings_array = self.model.encode(texts)
        return embeddings_array.tolist()

    def compute_cosine_similarity(self, emb1: list[float], emb2: list[float]) -> float:
        """
        Computes the cosine similarity between two vector lists.
        Modular and decoupled from text generation to allow reuse of precomputed embeddings.
        """
        try:
            from sentence_transformers import util
            sim_tensor = util.cos_sim(emb1, emb2)
            return float(sim_tensor[0][0])
        except Exception as e:
            logger.warning(f"Failed to compute similarity via sentence-transformers, using numpy fallback: {e}")
            import numpy as np
            v1 = np.array(emb1)
            v2 = np.array(emb2)
            dot = np.dot(v1, v2)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            if norm1 == 0 or norm2 == 0:
                return 0.0
            return float(dot / (norm1 * norm2))

    def compute_similarity_for_texts(self, source_text: str, compare_text: str) -> dict:
        """
        Generates embeddings for both texts, computes cosine similarity,
        and normalizes the score to a [0.0, 100.0] percentage range.
        Returns a dictionary with result metrics.
        """
        import time
        start_time = time.time()
        
        # Batch generation of both embeddings (faster than sequential generation)
        embeddings = self.generate_embeddings_batch([source_text, compare_text])
        emb1, emb2 = embeddings[0], embeddings[1]
        
        # Compute cosine similarity
        similarity = self.compute_cosine_similarity(emb1, emb2)
        
        # Normalize to 0-100% (mapping similarity <= 0 to 0% and similarity >= 1 to 100%)
        match_percentage = float(max(0.0, min(1.0, similarity)) * 100.0)
        
        processing_time_ms = (time.time() - start_time) * 1000.0
        
        return {
            "similarity_score": similarity,
            "match_percentage": round(match_percentage, 2),
            "dimensions": len(emb1),
            "processing_time_ms": round(processing_time_ms, 2)
        }

# Singleton instance
embedding_service = EmbeddingService()

