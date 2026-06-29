from weight_generator import generate_dynamic_weights
from signal_evaluator import evaluate_candidate_signals
from decision_engine import generate_hiring_decision

def rank_candidates(job_data: dict, semantic_candidates: list) -> dict:
    """
    Takes the job data and the list of semantic candidates (from Phase 3).
    1. Generates dynamic weights.
    2. Takes the top 20 semantic candidates.
    3. Uses the unified signal evaluator to score them.
    4. Calculates the final weighted score.
    5. Returns the ranked shortlist.
    """
    
    # 1. Generate Weights
    weights = generate_dynamic_weights(job_data)
    
    # 2. Limit to Top 20 to save processing time
    candidates_to_rank = semantic_candidates[:20]
    
    ranked_results = []
    
    for cand in candidates_to_rank:
        # In a real system, we'd fetch the full candidate profile from Supabase here.
        # For this prototype, we'll assume cand['metadata'] contains enough info, 
        # or we simulate the deep info if not fully available in Chroma metadata.
        # We'll pass the whole cand dict to simulate the full profile.
        
        signals = evaluate_candidate_signals(job_data, cand)
        
        # Calculate Evidence Confidence baseline (mocked from cand if missing)
        # Phase 2 stores this in Postgres. If we don't have it, we default to 75.
        evidence_score = 75 # Fallback
        
        # Apply Weights
        # weights = {semantic_similarity, skills_match, project_relevance, experience_match, education_match}
        w_sem = weights.get("semantic_similarity", 20) / 100.0
        w_skill = weights.get("skills_match", 20) / 100.0
        w_proj = weights.get("project_relevance", 20) / 100.0
        w_exp = weights.get("experience_match", 20) / 100.0
        w_edu = weights.get("education_match", 10) / 100.0
        
        sem_score = cand.get("similarity_score", 50)
        
        final_score = (
            (sem_score * w_sem) +
            (signals["skills_score"] * w_skill) +
            (signals["project_relevance_score"] * w_proj) +
            (signals["experience_score"] * w_exp) +
            (signals["education_score"] * w_edu)
        )
        
        # Boost slightly by evidence score
        final_score = min(100, final_score + (evidence_score * 0.05))
        
        cand_ranked = {
            "candidate_id": cand.get("candidate_id"),
            "name": cand.get("metadata", {}).get("name", "Unknown Candidate"),
            "role": cand.get("metadata", {}).get("role", ""),
            "final_score": round(final_score, 1),
            "semantic_score": sem_score,
            "skills_score": signals["skills_score"],
            "projects_score": signals["project_relevance_score"],
            "experience_score": signals["experience_score"],
            "missing_skills": signals["missing_skills"],
            "explainable_ai": signals["explanation"]
        }
        # Add the AI Decision (Hiring Recommendation, Strengths, Risks, etc.)
        # We pass the cand_ranked dict to the decision engine so it knows the scores
        decision = generate_hiring_decision(job_data, cand_ranked, final_score)
        cand_ranked["decision"] = decision
        
        ranked_results.append(cand_ranked)
        
    # Sort by final score descending
    ranked_results.sort(key=lambda x: x["final_score"], reverse=True)
    
    return {
        "dynamic_weights": weights,
        "ranked_candidates": ranked_results
    }
