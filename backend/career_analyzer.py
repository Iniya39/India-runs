import os
from google import genai
from pydantic import BaseModel, Field
from typing import List

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class CareerProgression(BaseModel):
    careerProgression: str = Field(description="Summary of how the candidate has progressed.")
    leadership: str = Field(description="Evidence of leadership or mentoring.")
    domainExpertise: List[str] = Field(description="Domains the candidate is an expert in.")
    businessImpact: str = Field(description="Business impact or outcomes driven by the candidate.")
    promotionHistory: str = Field(description="Any evident promotions or title upgrades over time.")

def analyze_career(experience_json: str) -> dict:
    prompt = f"""
    You are an expert AI Career Coach. Analyze the following candidate experience history.
    Extract and infer their Career Progression, Leadership, Domain Expertise, Business Impact, and Promotion History.
    If something is not present, return an empty string.
    
    Experience Data:
    {experience_json}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': CareerProgression,
            'temperature': 0.1
        }
    )
    
    parsed = CareerProgression.model_validate_json(response.text)
    return parsed.model_dump()
