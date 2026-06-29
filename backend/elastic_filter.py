import os
from elasticsearch import Elasticsearch

ES_HOST = os.environ.get("ELASTICSEARCH_HOST", "http://localhost:9200")
es = Elasticsearch([ES_HOST])
INDEX_NAME = "candidates"

def filter_candidates(parsed_query: dict) -> list[str]:
    """
    Takes the structured parsed query and runs an Elasticsearch boolean query.
    Returns a list of candidate IDs. Returns None if ES is unavailable.
    """
    try:
        # Check if ES is responding
        if not es.ping():
            print("Elasticsearch is not responding. Falling back.")
            return None
            
        must_clauses = []
        
        # Location filter
        if parsed_query.get("location"):
            must_clauses.append({"match": {"location": parsed_query["location"]}})
            
        # Experience filters - Assuming experienceLevel is indexed as a string or number, 
        # but in Phase 2 we indexed it as the text of careerProgression. 
        # We might just use full-text match for now if we don't have structured numeric experience.
        # But for strict filtering, we skip complex numeric logic if it's text.
        
        # Skills filter
        if parsed_query.get("skills"):
            for skill in parsed_query["skills"]:
                must_clauses.append({"match": {"skills": skill}})
                
        # If no filters, return all (up to a limit)
        if not must_clauses:
            query = {"match_all": {}}
        else:
            query = {"bool": {"must": must_clauses}}
            
        response = es.search(index=INDEX_NAME, body={"query": query, "size": 1000, "_source": False})
        
        candidate_ids = [hit["_id"] for hit in response["hits"]["hits"]]
        return candidate_ids
        
    except Exception as e:
        print(f"Elasticsearch filter failed: {e}")
        return None
