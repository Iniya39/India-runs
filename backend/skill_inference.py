import os
from google import genai
from pydantic import BaseModel, Field
from typing import List

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class InferredSkill(BaseModel):
    skill: str = Field(description="The inferred skill name.")
    context: str = Field(description="The context or text from the resume that implies this skill.")

class HiddenSkillsResponse(BaseModel):
    inferredSkills: List[InferredSkill]

def infer_hidden_skills(resume_text: str, explicit_skills: List[str]) -> List[dict]:
    prompt = f"""
    You are an expert AI Resume Analyst. Given the following resume text and the explicitly listed skills,
    infer additional "Hidden Skills" that the candidate possesses based on their projects, experience, and context.
    For example, if they built a Kubernetes pipeline, infer 'Docker', 'CI/CD', 'Microservices'.
    Do NOT include skills that are already in the explicit_skills list.
    
    Explicit Skills: {', '.join(explicit_skills)}
    
    Resume Text:
    {resume_text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': HiddenSkillsResponse,
            'temperature': 0.1
        }
    )
    
    parsed = HiddenSkillsResponse.model_validate_json(response.text)
    return [s.model_dump() for s in parsed.inferredSkills]
