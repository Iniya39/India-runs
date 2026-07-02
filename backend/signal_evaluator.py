import os
from google import genai
from pydantic import BaseModel, Field

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class CandidateSignals(BaseModel):
    skills_score: int = Field(description="Score out of 100 for skills match (considering hidden and related skills).")
    project_relevance_score: int = Field(description="Score out of 100 for project relevance (complexity, tech match).")
    experience_score: int = Field(description="Score out of 100 for experience match (years, leadership, domain).")
    education_score: int = Field(description="Score out of 100 for education & certifications match.")
    missing_skills: list[str] = Field(default_factory=list, description="Critical skills from the job description the candidate is completely missing.")
    explanation: str = Field(description="A brief 2-3 sentence explanation of the candidate's strengths and weaknesses relative to this job.")

def evaluate_candidate_signals(job_data: dict, candidate_profile: dict) -> dict:
    """
    Evaluates a single candidate against the job data.
    Uses Gemini to holistically evaluate skills, projects, experience, and education,
    returning structured scores and missing skills.
    """
    prompt = f"""
    You are an AI Tech Recruiter evaluating a candidate against a job requirement.
    
    JOB REQUIREMENT:
    Role: {job_data.get('role', 'Unknown')}
    Skills Required: {job_data.get('required_skills', [])}
    Experience Required: {job_data.get('experience_level', 'Not specified')}
    Domain: {job_data.get('domain', 'Not specified')}
    
    CANDIDATE PROFILE:
    Name: {candidate_profile.get('resumeMetadata', {}).get('name', 'Candidate')}
    Inferred Skills: {candidate_profile.get('hiddenSkills', [])}
    Projects: {candidate_profile.get('projectIntelligence', [])}
    Career Progression: {candidate_profile.get('careerIntelligence', {}).get('careerProgression', 'Unknown')}
    Evidence Confidence: {candidate_profile.get('evidenceConfidence', [])}
    
    TASK:
    Evaluate the candidate on 4 dimensions out of 100:
    1. Skills Score (Don't just keyword match; understand related techs like React/Next.js)
    2. Project Relevance (Reward relevant architecture and complexity)
    3. Experience Score (Reward relevant domain and progression)
    4. Education Score (Degrees, Certifications)
    
    Also list any truly missing required skills, and provide a short recruiter explanation.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': CandidateSignals,
                'temperature': 0.1
            }
        )
        return CandidateSignals.model_validate_json(response.text).model_dump()
    except Exception as e:
        print(f"Signal evaluation failed for candidate: {e}")
        return {
            "skills_score": 50,
            "project_relevance_score": 50,
            "experience_score": 50,
            "education_score": 50,
            "missing_skills": [],
            "explanation": "Failed to generate AI evaluation."
        }
