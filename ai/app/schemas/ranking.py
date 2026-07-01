from pydantic import BaseModel, Field


class Candidate(BaseModel):
    candidate_id: str = Field(
        ...,
        description="Unique identifier for the candidate.",
        min_length=1,
        examples=["cand-001"],
    )
    name: str = Field(
        ...,
        description="Full name of the candidate.",
        examples=["Priya Sharma"],
    )
    profile: str = Field(
        ...,
        description="Free-text candidate profile or professional summary.",
        examples=[
            "Senior backend engineer with 6 years of experience building "
            "Python APIs and ML-powered services."
        ],
    )
    skills: list[str] = Field(
        ...,
        description="Technical and professional skills possessed by the candidate.",
        examples=[["Python", "FastAPI", "AWS", "Machine Learning"]],
    )
    projects: list[str] = Field(
        ...,
        description="Notable projects the candidate has contributed to.",
        examples=[["Talent matching platform", "Real-time analytics pipeline"]],
    )
    experience: float = Field(
        ...,
        description="Total years of professional experience.",
        ge=0,
        examples=[6.0],
    )
    certifications: list[str] = Field(
        ...,
        description="Professional certifications held by the candidate.",
        examples=[["AWS Solutions Architect", "Google Professional ML Engineer"]],
    )
    education: str = Field(
        ...,
        description="Highest or most relevant education qualification.",
        examples=["B.Tech in Computer Science, IIT Delhi"],
    )


class RankingRequest(BaseModel):
    job_description: str = Field(
        ...,
        description="The job description to rank candidates against.",
        min_length=1,
        examples=[
            "Senior Python developer with FastAPI, machine learning, "
            "and AWS experience."
        ],
    )
    candidates: list[Candidate] = Field(
        ...,
        description="List of candidates to evaluate and rank for the job.",
        min_length=1,
    )


class RankedCandidate(BaseModel):
    candidate_id: str = Field(
        ...,
        description="Unique identifier of the ranked candidate.",
        min_length=1,
    )
    name: str = Field(
        ...,
        description="Full name of the ranked candidate.",
    )
    final_score: float = Field(
        ...,
        description="Weighted composite ranking score (0.0–100.0).",
        ge=0,
        le=100,
    )
    semantic_similarity: float = Field(
        ...,
        description="Semantic similarity between job description and candidate profile (0.0–100.0).",
        ge=0,
        le=100,
    )
    skills_match: float = Field(
        ...,
        description="Skills overlap score against job requirements (0.0–100.0).",
        ge=0,
        le=100,
    )
    project_relevance: float = Field(
        ...,
        description="Relevance of candidate projects to the job (0.0–100.0).",
        ge=0,
        le=100,
    )
    experience_match: float = Field(
        ...,
        description="Experience level fit score (0.0–100.0).",
        ge=0,
        le=100,
    )
    certification_score: float = Field(
        ...,
        description="Certification relevance score (0.0–100.0).",
        ge=0,
        le=100,
    )
    education_score: float = Field(
        ...,
        description="Education relevance score (0.0–100.0).",
        ge=0,
        le=100,
    )
    explanation: str = Field(
        ...,
        description="Human-readable summary explaining the candidate's ranking.",
    )


class RankingResponse(BaseModel):
    rankings: list[RankedCandidate] = Field(
        ...,
        description="Candidates ranked by final_score in descending order.",
    )
