from pydantic import BaseModel, Field


class CandidateProfile(BaseModel):
    candidate_id: str = Field(min_length=1)
    full_name: str
    profile_summary: str
    skills: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    years_of_experience: float = Field(default=0.0, ge=0)
    certifications: list[str] = Field(default_factory=list)
    education: str = ""
