import os
from google import genai
from pydantic import BaseModel, Field
from typing import List

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class IntelligentEducation(BaseModel):
    degree: str = ""
    university: str = ""
    cgpa: str = ""
    graduationYear: str = ""
    relevantCoursework: List[str] = Field(default_factory=list)
    specialization: str = ""
    academicProjects: List[str] = Field(default_factory=list)
    awards: List[str] = Field(default_factory=list)

class EducationIntelligenceResponse(BaseModel):
    education: List[IntelligentEducation]

def analyze_education(resume_text: str, base_education_json: str) -> List[dict]:
    prompt = f"""
    You are an AI Education Assessor. Based on the resume text and the base education data,
    extract deep educational intelligence including coursework, specialization, academic projects, and awards.
    
    Base Education: {base_education_json}
    
    Resume Text:
    {resume_text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': EducationIntelligenceResponse,
            'temperature': 0.1
        }
    )
    
    parsed = EducationIntelligenceResponse.model_validate_json(response.text)
    return [e.model_dump() for e in parsed.education]
