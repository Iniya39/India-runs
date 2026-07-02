import os
from google import genai
from pydantic import BaseModel, Field

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class ComparisonResult(BaseModel):
    executive_summary: str = Field(description="A 2-3 sentence overview comparing the candidates.")
    tradeoffs: dict = Field(description="A dictionary mapping candidate ID to their specific trade-off (e.g. 'Stronger in Backend, weaker in Cloud').")
    recommended_candidate_id: str = Field(description="The ID of the candidate the AI recommends overall.")
    recommendation_reason: str = Field(description="Why this specific candidate is recommended over the others.")

def generate_comparison(job_data: dict, candidates: list) -> dict:
    """
    Compares 2-5 candidates and highlights trade-offs.
    Expects candidates to already have their scores and decision data.
    """
    if len(candidates) < 2:
        return {"error": "Need at least 2 candidates to compare."}
        
    prompt = f"""
    You are an AI Tech Recruiter comparing candidates for a hiring manager.
    
    JOB ROLE: {job_data.get('role', 'Unknown')}
    
    CANDIDATES:
    """
    for c in candidates:
        prompt += f"""
        ---
        ID: {c.get('candidate_id')}
        Name: {c.get('name')}
        Final Score: {c.get('final_score')}
        Strengths: {c.get('decision', {}).get('strengths', [])}
        Risks: {c.get('decision', {}).get('risks', [])}
        """
        
    prompt += """
    TASK:
    Generate a concise comparison highlighting the trade-offs (do not just repeat their scores). 
    Recommend one overall winner based on the balance of strengths and risks.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
=======
            model='gemini-2.5-flash',
>>>>>>> origin/Version-2
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': ComparisonResult,
                'temperature': 0.1
            }
        )
        return ComparisonResult.model_validate_json(response.text).model_dump()
    except Exception as e:
        print(f"Comparison failed: {e}")
        return {
            "executive_summary": "Comparison unavailable due to AI processing error.",
            "tradeoffs": {},
            "recommended_candidate_id": candidates[0].get("candidate_id"),
            "recommendation_reason": "Defaulting to highest scored candidate."
        }
