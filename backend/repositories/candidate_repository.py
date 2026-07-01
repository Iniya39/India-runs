import logging
from typing import Any

from database import get_supabase
from models.candidate import CandidateProfile

logger = logging.getLogger(__name__)

DEFAULT_CANDIDATE_LIMIT = 100


class CandidateRepositoryError(Exception):
    """Raised when candidate data cannot be retrieved from the database."""


class CandidateRepository:
    def __init__(self, supabase_client: Any | None = None) -> None:
        self._supabase = supabase_client

    def get_active_candidates(self, limit: int = DEFAULT_CANDIDATE_LIMIT) -> list[CandidateProfile]:
        try:
            supabase = self._supabase or get_supabase()
            active_user_ids = self._get_active_candidate_user_ids(supabase)
            if not active_user_ids:
                return []

            result = (
                supabase.table("candidateProfiles")
                .select("*")
                .eq("profileComplete", True)
                .in_("id", active_user_ids)
                .limit(limit)
                .execute()
            )
            rows = result.data or []
            return [self._to_domain(row) for row in rows]
        except Exception as exc:
            logger.error("Failed to retrieve active candidates", extra={"error": str(exc)})
            raise CandidateRepositoryError("Failed to retrieve candidate profiles") from exc

    @staticmethod
    def _get_active_candidate_user_ids(supabase: Any) -> list[str]:
        users_result = (
            supabase.table("users")
            .select("id, role, onboardingComplete")
            .eq("role", "candidate")
            .eq("onboardingComplete", True)
            .execute()
        )
        return [str(row["id"]) for row in (users_result.data or []) if row.get("id")]

    @staticmethod
    def _to_domain(row: dict[str, Any]) -> CandidateProfile:
        basics = row.get("basics") or {}
        if not isinstance(basics, dict):
            basics = {}

        skills = _normalize_string_list(row.get("skills"))
        soft_skills = _normalize_string_list(row.get("softSkills"))
        hidden_skills = _extract_hidden_skills(row.get("hiddenSkills"))
        all_skills = _merge_unique_strings(skills, soft_skills, hidden_skills)

        years = _extract_years_of_experience(basics, row.get("experience"))
        profile_summary = _build_profile_summary(basics)
        projects = _extract_projects(row.get("projects"))
        education = _extract_education(row.get("education"))
        certifications = _extract_certifications(row)

        full_name = (
            basics.get("name")
            or basics.get("fullName")
            or row.get("displayName")
            or "Unknown Candidate"
        )

        return CandidateProfile(
            candidate_id=str(row.get("id")),
            full_name=str(full_name),
            profile_summary=profile_summary,
            skills=all_skills,
            projects=projects,
            years_of_experience=years,
            certifications=certifications,
            education=education,
        )


def _extract_hidden_skills(hidden_skills: Any) -> list[str]:
    if not isinstance(hidden_skills, list):
        return []
    skills: list[str] = []
    for item in hidden_skills:
        if isinstance(item, dict) and isinstance(item.get("skill"), str):
            skills.append(item["skill"])
        elif isinstance(item, str):
            skills.append(item)
    return skills


def _extract_years_of_experience(basics: dict[str, Any], experience: Any) -> float:
    if isinstance(basics.get("yearsExperience"), (int, float)):
        return max(0.0, float(basics["yearsExperience"]))

    if isinstance(experience, list) and experience:
        return max(0.0, float(len(experience)))

    return 0.0


def _build_profile_summary(basics: dict[str, Any]) -> str:
    parts = [
        basics.get("headline"),
        basics.get("summary"),
        basics.get("aboutMe"),
    ]
    return ". ".join(part.strip() for part in parts if isinstance(part, str) and part.strip())


def _extract_projects(projects: Any) -> list[str]:
    if not isinstance(projects, list):
        return []

    extracted: list[str] = []
    for project in projects:
        if isinstance(project, str) and project.strip():
            extracted.append(project.strip())
            continue
        if not isinstance(project, dict):
            continue

        title = project.get("title") or project.get("name") or ""
        description = project.get("description") or ""
        technologies = project.get("technologies") or project.get("techStack") or []
        tech_text = ", ".join(_normalize_string_list(technologies))
        parts = [str(part).strip() for part in (title, description, tech_text) if str(part).strip()]
        if parts:
            extracted.append(" - ".join(parts))
    return extracted


def _extract_education(education: Any) -> str:
    if isinstance(education, str):
        return education.strip()
    if not isinstance(education, list) or not education:
        return ""

    entries: list[str] = []
    for item in education:
        if isinstance(item, str) and item.strip():
            entries.append(item.strip())
            continue
        if not isinstance(item, dict):
            continue
        degree = item.get("degree") or ""
        school = item.get("school") or item.get("institution") or ""
        field = item.get("fieldOfStudy") or ""
        parts = [str(part).strip() for part in (degree, field, school) if str(part).strip()]
        if parts:
            entries.append(", ".join(parts))
    return "; ".join(entries)


def _extract_certifications(row: dict[str, Any]) -> list[str]:
    direct = _normalize_string_list(row.get("certifications"))
    if direct:
        return direct

    certification_intel = row.get("certificationIntelligence")
    if isinstance(certification_intel, list):
        names = []
        for item in certification_intel:
            if isinstance(item, dict):
                name = item.get("certificationName") or item.get("name")
                if isinstance(name, str) and name.strip():
                    names.append(name.strip())
        if names:
            return names
    return []


def _normalize_string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        stripped = value.strip()
        return [stripped] if stripped else []
    if isinstance(value, list):
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]
    return []


def _merge_unique_strings(*lists: list[str]) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for items in lists:
        for item in items:
            key = item.lower()
            if key not in seen:
                seen.add(key)
                merged.append(item)
    return merged
