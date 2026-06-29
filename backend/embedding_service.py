from sentence_transformers import SentenceTransformer

# Initialize the model once
# BAAI/bge-small-en-v1.5 is the required model for this phase
model = SentenceTransformer('BAAI/bge-small-en-v1.5')

def generate_embedding(text: str) -> list[float]:
    """
    Generates a semantic embedding for the given text.
    The embedding represents the entire hiring intent including semantic meaning, 
    not just keywords.
    """
    # BGE models usually benefit from an instruction for retrieval tasks.
    # We can prefix with a standard query instruction if needed, but for now
    # we just embed the document.
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
