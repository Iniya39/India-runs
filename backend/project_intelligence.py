import os
from google import genai
from pydantic import BaseModel, Field
from typing import List

# Ensure GEMINI_API_KEY is available
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class IntelligentProject(BaseModel):
    projectName: str = ""
    problemStatement: str = ""
    businessDomain: str = ""
    projectType: str = ""
    technologies: List[str] = Field(default_factory=list)
    architecture: str = ""
    roleInProject: str = ""
    teamSize: str = ""
    complexity: str = ""
    impact: str = ""

class ProjectIntelligenceResponse(BaseModel):
    projects: List[IntelligentProject]

def analyze_projects(resume_text: str, projects_json: str) -> List[dict]:
    prompt = f"""
    You are an expert technical AI. Given the following resume text and the base extracted projects,
    deeply analyze the projects to infer and extract advanced details. 
    Do NOT simply copy the input. Understand the context to infer architecture, complexity, business domain, and impact.
    
    Base Projects JSON:
    {projects_json}
    
    Full Resume Text (for context):
    {resume_text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ProjectIntelligenceResponse,
            'temperature': 0.1
        }
    )
    
    parsed = ProjectIntelligenceResponse.model_validate_json(response.text)
    return [p.model_dump() for p in parsed.projects]
