import os
from google import genai
from pydantic import BaseModel, Field

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class DynamicWeights(BaseModel):
    semantic_similarity: int = Field(description="Weight for semantic search match (0-100)")
    skills_match: int = Field(description="Weight for skills match (0-100)")
    project_relevance: int = Field(description="Weight for project relevance (0-100)")
    experience_match: int = Field(description="Weight for experience match (0-100)")
    education_match: int = Field(description="Weight for education & certifications (0-100)")
    rationale: str = Field(description="Explanation of why these weights were chosen for this specific job.")

def generate_dynamic_weights(job_data: dict) -> dict:
    """
    Analyzes the job description and generates dynamic scoring weights based on the hiring intent.
    The sum of all weights must be exactly 100.
    """
    prompt = f"""
    You are an expert AI Tech Recruiter.
    Review the following job role and determine the ideal weighting (out of 100) for evaluating candidates.
    If the role is senior, experience might weigh more. If it's research/AI, projects and education might weigh more.
    If it's frontend, projects and skills might weigh more.
    
    The weights MUST sum to exactly 100.
    
    Job Data:
    {job_data}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': DynamicWeights,
                'temperature': 0.1
            }
        )
        parsed = DynamicWeights.model_validate_json(response.text)
        weights_dict = parsed.model_dump()
        
        # Ensure it sums to 100
        total = sum(v for k, v in weights_dict.items() if isinstance(v, int))
        if total != 100 and total > 0:
            # Normalize if slightly off
            for k in ["semantic_similarity", "skills_match", "project_relevance", "experience_match", "education_match"]:
                weights_dict[k] = int((weights_dict[k] / total) * 100)
                
        return weights_dict
    except Exception as e:
        print(f"Weight generation failed: {e}")
        # Fallback reasonable defaults
        return {
            "semantic_similarity": 25,
            "skills_match": 25,
            "project_relevance": 20,
            "experience_match": 20,
            "education_match": 10,
            "rationale": "Fallback weights due to processing error."
        }
