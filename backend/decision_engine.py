import os
from google import genai
from pydantic import BaseModel, Field
from typing import List, Dict

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class ReadinessScores(BaseModel):
    technical: int = Field(description="0-100")
    communication: int = Field(description="0-100")
    leadership: int = Field(description="0-100")
    domain: int = Field(description="0-100")

class CandidateDecision(BaseModel):
    recommendation: str = Field(description="Must be exactly one of: 'Strong Fit', 'Good Fit', 'Potential Fit', 'Low Fit'")
    summary: str = Field(description="A 2-3 sentence Recruiter Decision Assistant summary.")
    strengths: List[str] = Field(description="2-4 evidence-backed strengths (e.g. 'Strong Backend Architecture Experience')")
    risks: List[str] = Field(description="1-3 potential hiring risks (e.g. 'Limited Production Experience'). Do not penalize unfairly.")
    growth_potential: str = Field(description="A label like 'High Growth Potential', 'Startup Ready', 'Enterprise Ready', 'Fast Learner'.")
    interview_focus: List[str] = Field(description="2-4 technical or behavioral topics to focus on during the interview.")
    readiness: ReadinessScores

def generate_hiring_decision(job_data: dict, candidate_profile: dict, final_score: float) -> dict:
    """
    Acts as the final AI Hiring Manager.
    Evaluates the candidate holistically and generates the final Recruiter Decision Report.
    """
    prompt = f"""
    You are an expert AI Hiring Manager evaluating a candidate for a role.
    
    JOB REQUIREMENT:
    Role: {job_data.get('role', 'Unknown')}
    Required Skills: {job_data.get('required_skills', [])}
    Experience Level: {job_data.get('experience_level', 'Not specified')}
    Domain: {job_data.get('domain', 'Not specified')}
    
    CANDIDATE DATA:
    Name: {candidate_profile.get('name', 'Candidate')}
    AI Final Score: {final_score}/100
    Missing Skills: {candidate_profile.get('missing_skills', [])}
    Semantic Match: {candidate_profile.get('semantic_score', 0)}
    Projects Score: {candidate_profile.get('projects_score', 0)}
    Experience Score: {candidate_profile.get('experience_score', 0)}
    Explainable AI Note: {candidate_profile.get('explainable_ai', '')}
    
    TASK:
    Generate a holistic hiring decision report in JSON.
    - recommendation: Must be 'Strong Fit', 'Good Fit', 'Potential Fit', or 'Low Fit'. Do not strictly base this on AI Final Score; evaluate the whole profile.
    - summary: A concise recruiter-friendly summary.
    - strengths/risks: Keep them realistic and evidence-based.
    - growth_potential: A short punchy label.
    - interview_focus: What should the interviewer drill into?
    - readiness: 4 scores out of 100.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': CandidateDecision,
                'temperature': 0.1
            }
        )
        return CandidateDecision.model_validate_json(response.text).model_dump()
    except Exception as e:
        print(f"Decision generation failed: {e}")
        return {
            "recommendation": "Potential Fit",
            "summary": "AI Decision generation failed due to an error. Proceed with standard technical screening.",
            "strengths": ["Data unavailable"],
            "risks": ["Data unavailable"],
            "growth_potential": "Unknown",
            "interview_focus": ["General technical screening"],
            "readiness": {"technical": 50, "communication": 50, "leadership": 50, "domain": 50}
        }
