from google import genai
import os
from pydantic import BaseModel, Field

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class JobUnderstanding(BaseModel):
    role: str = Field(description="The primary job title or role.")
    department: str = Field(description="Inferred or stated department.")
    domain: str = Field(description="Job domain (e.g., Software Engineering, Data Science).")
    seniorityLevel: str = Field(description="e.g., Junior, Mid-Level, Senior, Lead, Manager.")
    industry: str = Field(description="Industry sector, if available.")
    primarySkills: list[str] = Field(description="Core primary skills required.")
    secondarySkills: list[str] = Field(description="Helpful secondary skills.")
    requiredSkills: list[str] = Field(description="Explicitly stated required skills.")
    preferredSkills: list[str] = Field(description="Explicitly stated preferred skills.")
    mustHaveSkills: list[str] = Field(description="Non-negotiable skills.")
    niceToHaveSkills: list[str] = Field(description="Nice to have skills.")
    programmingLanguages: list[str] = Field(description="Extracted programming languages.")
    frameworks: list[str] = Field(description="Extracted frameworks.")
    libraries: list[str] = Field(description="Extracted libraries.")
    databases: list[str] = Field(description="Extracted databases.")
    cloudPlatforms: list[str] = Field(description="Extracted cloud platforms.")
    devopsTools: list[str] = Field(description="Extracted DevOps and CI/CD tools.")
    aiTechnologies: list[str] = Field(description="Extracted AI/ML technologies.")
    softSkills: list[str] = Field(description="Extracted soft skills (e.g., communication, teamwork).")
    experienceRange: str = Field(description="Experience range (e.g., '3-5 years').")
    education: str = Field(description="Education requirements (e.g., 'Bachelors in CS').")
    certifications: list[str] = Field(description="Required or preferred certifications.")
    responsibilities: list[str] = Field(description="Extracted list of responsibilities.")
    businessObjectives: list[str] = Field(description="Inferred business objectives or goals for this role.")
    hiringPriorities: list[str] = Field(description="Inferred hiring priorities.")
    importantHiddenRequirements: list[str] = Field(description="Hidden context (e.g., if JD says 'build scalable backend', infer 'Distributed Systems', 'System Design').")

def parse_job_description(description: str) -> JobUnderstanding:
    prompt = f"""
    You are an expert technical recruiter and AI Job Parsing system.
    Analyze the following Job Description. Do NOT rely on simple keyword matching.
    Understand the meaning and context of the Job Description and extract structured information.
    
    If you see phrases like "work closely with product teams", you should infer "Cross Functional Collaboration".
    If you see phrases like "build scalable backend systems", you should infer "System Design", "Distributed Systems", "Microservices", "Scalability", "Performance Optimization".
    
    Infer context instead of only extracting exact words.
    
    Job Description:
    {description}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': JobUnderstanding,
            'temperature': 0.1
        }
    )
    
    return JobUnderstanding.model_validate_json(response.text)
