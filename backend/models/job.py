from pydantic import BaseModel, Field


class JobPosting(BaseModel):
    job_id: str = Field(min_length=1)
    title: str
    description: str
    required_skills: list[str] = Field(default_factory=list)
    required_experience: str | None = None
    education: str | None = None
    certifications: list[str] = Field(default_factory=list)

    def build_ranking_description(self) -> str:
        """Build a rich job description for the AI ranking service."""
        sections = [self.description.strip()]

        if self.required_skills:
            sections.append(f"Required skills: {', '.join(self.required_skills)}.")
        if self.required_experience:
            sections.append(f"Required experience: {self.required_experience}.")
        if self.education:
            sections.append(f"Education requirements: {self.education}.")
        if self.certifications:
            sections.append(f"Preferred certifications: {', '.join(self.certifications)}.")

        return " ".join(section for section in sections if section)
