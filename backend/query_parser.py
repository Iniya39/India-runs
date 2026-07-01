import os
from google import genai
from pydantic import BaseModel, Field
from typing import List, Optional

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class ParsedQuery(BaseModel):
    primaryRole: str = Field(description="The primary job role being searched for, e.g., 'AI Engineer'.")
    skills: List[str] = Field(default_factory=list, description="List of technical and soft skills mentioned.")
    location: Optional[str] = Field(default=None, description="Location mentioned, e.g., 'Chennai'.")
    minExperience: Optional[int] = Field(default=None, description="Minimum years of experience requested.")
    maxExperience: Optional[int] = Field(default=None, description="Maximum years of experience requested.")
    domain: Optional[str] = Field(default=None, description="Preferred domain or industry.")
    noticePeriod: Optional[str] = Field(default=None, description="Notice period constraints.")
    workMode: Optional[str] = Field(default=None, description="Work mode, e.g., 'Remote', 'Hybrid', 'Onsite'.")
    semanticSearchText: str = Field(description="A clean sentence combining the role, domain, and skills to be used for embedding generation.")

def parse_search_query(query: str) -> dict:
    prompt = f"""
    You are an AI assistant for a Recruiter Search Engine.
    Analyze the recruiter's search query and extract structured filtering fields.
    Also generate a 'semanticSearchText' which is a clean string that captures the hiring intent (to be used for embedding).
    
    Search Query:
    "{query}"
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ParsedQuery,
            'temperature': 0.1
        }
    )
    
    parsed = ParsedQuery.model_validate_json(response.text)
    return parsed.model_dump()
