from google import genai
import os
from pydantic import BaseModel, Field

# Ensure GEMINI_API_KEY is available in the environment
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class JDSuggestion(BaseModel):
    jobSummary: str = Field(description="A brief professional summary of the role.")
    keyResponsibilities: list[str] = Field(description="Key responsibilities and duties.")
    requiredSkills: list[str] = Field(description="Must-have required skills.")
    preferredSkills: list[str] = Field(description="Nice-to-have preferred skills.")
    mustHaveSkills: list[str] = Field(description="Non-negotiable skills for the role.")
    niceToHaveSkills: list[str] = Field(description="Skills that are a bonus but not strictly required.")
    technologies: list[str] = Field(description="Programming languages, frameworks, libraries, databases, etc.")
    experienceRange: str = Field(description="Required experience range (e.g., '3-5 years').")
    educationRequirements: str = Field(description="Educational degree requirements.")
    certifications: list[str] = Field(description="Preferred or required certifications.")
    softSkills: list[str] = Field(description="Crucial soft skills (e.g., Leadership, Communication).")
    interviewFocusAreas: list[str] = Field(description="Key areas candidates will be interviewed on.")
    hiringPriorities: list[str] = Field(description="Primary priorities for hiring this role.")
    expectedDeliverables: list[str] = Field(description="What the candidate is expected to deliver in the first 30/60/90 days or generally.")
    markdown: str = Field(description="The complete Job Description formatted beautifully in Markdown.")

def generate_jd_suggestion(title: str) -> JDSuggestion:
    prompt = f"""
    You are an expert technical recruiter. Generate a comprehensive and professional Job Description for the role: '{title}'.
    
    The output must be highly professional, engaging, and detailed. 
    Ensure all sections (Job Summary, Responsibilities, Skills, etc.) are thoroughly fleshed out.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': JDSuggestion,
            'temperature': 0.7
        }
    )
    
    # We parse the response json into the Pydantic model
    return JDSuggestion.model_validate_json(response.text)
