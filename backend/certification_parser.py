import os
from google import genai
from pydantic import BaseModel, Field
from typing import List

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class IntelligentCertification(BaseModel):
    certificationName: str = ""
    organization: str = ""
    issueDate: str = ""
    expiration: str = ""
    skillAreas: List[str] = Field(default_factory=list)
    difficulty: str = ""
    industryRecognition: str = ""

class CertificationIntelligenceResponse(BaseModel):
    certifications: List[IntelligentCertification]

def analyze_certifications(resume_text: str, base_certifications_json: str) -> List[dict]:
    prompt = f"""
    You are an AI Certification Analyst. Based on the resume text and the base certifications,
    extract deep intelligence about the certifications including skill areas, difficulty, and industry recognition.
    
    Base Certifications: {base_certifications_json}
    
    Resume Text:
    {resume_text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': CertificationIntelligenceResponse,
            'temperature': 0.1
        }
    )
    
    parsed = CertificationIntelligenceResponse.model_validate_json(response.text)
    return [c.model_dump() for c in parsed.certifications]
