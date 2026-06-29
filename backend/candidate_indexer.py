import os
from elasticsearch import Elasticsearch
import uuid

# Connect to Elasticsearch
ES_HOST = os.environ.get("ELASTICSEARCH_HOST", "http://localhost:9200")
es = Elasticsearch([ES_HOST])

INDEX_NAME = "candidates"

def setup_candidate_index():
    if not es.indices.exists(index=INDEX_NAME):
        mapping = {
            "mappings": {
                "properties": {
                    "candidate_id": {"type": "keyword"},
                    "location": {"type": "keyword"},
                    "experienceLevel": {"type": "keyword"},
                    "skills": {"type": "keyword"},
                    "education": {"type": "keyword"},
                    "degree": {"type": "keyword"},
                    "certifications": {"type": "keyword"},
                    "domain": {"type": "keyword"},
                    "industry": {"type": "keyword"},
                    "workMode": {"type": "keyword"},
                    "created_at": {"type": "date"}
                }
            }
        }
        es.indices.create(index=INDEX_NAME, body=mapping)
        print(f"Created Elasticsearch index: {INDEX_NAME}")

def index_candidate(candidate_id: str, data: dict):
    """
    Index a candidate into Elasticsearch.
    Data is expected to have structured fields ready for indexing.
    """
    try:
        # Create or update candidate document
        # We use candidate_id as the document ID so re-indexing overwrites
        es.index(index=INDEX_NAME, id=candidate_id, document=data)
        print(f"Successfully indexed candidate {candidate_id} in Elasticsearch.")
    except Exception as e:
        print(f"Failed to index candidate {candidate_id} in Elasticsearch: {e}")
