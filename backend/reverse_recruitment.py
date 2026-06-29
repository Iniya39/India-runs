from retrieval_service import retrieve_candidates
from ranking_engine import rank_candidates

def find_passive_candidates_for_job(job_data: dict, top_k: int = 10):
    """
    Reverse Recruitment: Finds candidates from the entire DB who match the job
    but have not explicitly applied.
    """
    
    # 1. Build a synthetic query from the Job Data
    job_role = job_data.get("basics", {}).get("title", "Role")
    job_skills = ", ".join(job_data.get("skills", {}).get("required", []))
    
    synthetic_query = f"Need a {job_role} with skills in {job_skills}"
    
    # 2. Run through the hybrid retrieval engine
    retrieval_results = retrieve_candidates(synthetic_query)
    semantic_candidates = retrieval_results.get("candidates", [])
    
    # 3. AI Re-rank the retrieved candidates
    # We pass a simplified job_data dictionary that the ranking engine expects
    ranking_job_data = {
        "role": job_role,
        "required_skills": job_data.get("skills", {}).get("required", []),
        "experience_level": job_data.get("requirements", {}).get("experience_level", "Unknown"),
        "domain": job_data.get("basics", {}).get("department", "Unknown")
    }
    
    ranked_results = rank_candidates(ranking_job_data, semantic_candidates)
    
    passive_candidates = []
    
    for rank in ranked_results.get("ranked_candidates", [])[:top_k]:
        # Add flags specific to reverse recruitment
        rank["status"] = "Not Applied"
        rank["invite_recommended"] = rank["final_score"] > 80
        passive_candidates.append(rank)
        
    return {
        "dynamic_weights": ranked_results.get("dynamic_weights"),
        "recommended_passive_candidates": passive_candidates
    }
