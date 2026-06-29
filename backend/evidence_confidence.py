import os
from google import genai
from pydantic import BaseModel, Field
from typing import List

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class SkillEvidence(BaseModel):
    skill: str = Field(description="The skill name.")
    confidenceScore: int = Field(description="Confidence score from 0 to 100.")
    evidence: List[str] = Field(description="List of specific evidences (e.g., '3 Projects', '2 Years Experience', 'Used in Project X').")

class EvidenceConfidenceResponse(BaseModel):
    skillsConfidence: List[SkillEvidence]

def calculate_evidence_confidence(resume_text: str, all_skills: List[str]) -> List[dict]:
    prompt = f"""
    You are an expert AI recruiter evaluating a candidate's genuine proficiency.
    Given the candidate's full resume text and a list of their skills (explicit and inferred),
    calculate an 'Evidence Confidence Score' (0-100) for each skill based strictly on tangible evidence 
    found in their experience, projects, education, and certifications.
    
    If a skill is just listed in a "Skills" section but never mentioned in projects/experience, give it a lower score (e.g., 40-60).
    If a skill has strong evidence (e.g., used in 3 projects, 2 years at a job), give it a high score (85-99).
    
    Skills to evaluate: {', '.join(all_skills)}
    
    Resume Text:
    {resume_text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': EvidenceConfidenceResponse,
            'temperature': 0.1
        }
    )
    
    parsed = EvidenceConfidenceResponse.model_validate_json(response.text)
    return [s.model_dump() for s in parsed.skillsConfidence]
