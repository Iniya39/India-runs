from pydantic import BaseModel, Field

from ai_client import RankedCandidateResult


class JobSummaryResponse(BaseModel):
    job_id: str = Field(..., description="Unique identifier of the job posting.")
    title: str = Field(..., description="Job title.")
    description: str = Field(..., description="Job description used for ranking.")
    required_skills: list[str] = Field(
        default_factory=list, description="Required skills for the role."
    )
    required_experience: str | None = Field(
        default=None, description="Required experience range or level."
    )
    education: str | None = Field(default=None, description="Education requirements.")
    certifications: list[str] = Field(
        default_factory=list, description="Preferred or required certifications."
    )


class AISuggestionsResponse(BaseModel):
    job: JobSummaryResponse = Field(..., description="Job posting metadata.")
    rankings: list[RankedCandidateResult] = Field(
        default_factory=list,
        description="Candidates ranked by final_score in descending order.",
    )
    candidate_count: int = Field(
        ..., description="Number of active candidates evaluated for ranking."
    )
    elapsed_ms: float = Field(
        ..., description="Total time taken to process the AI suggestions request."
    )
