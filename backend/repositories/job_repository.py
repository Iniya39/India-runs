import logging
from typing import Any

from database import get_supabase
from models.job import JobPosting

logger = logging.getLogger(__name__)


class JobRepositoryError(Exception):
    """Raised when job data cannot be retrieved from the database."""


class JobRepository:
    def __init__(self, supabase_client: Any | None = None) -> None:
        self._supabase = supabase_client

    def get_job_by_id(self, job_id: str) -> JobPosting | None:
        try:
            supabase = self._supabase or get_supabase()
            result = (
                supabase.table("jobs")
                .select("*")
                .eq("id", job_id)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            if not rows:
                return None

            job_row = rows[0]
            parsed_row = self._get_parsed_job(supabase, job_id)
            return self._to_domain(job_row, parsed_row)
        except Exception as exc:
            logger.error("Failed to retrieve job", extra={"job_id": job_id, "error": str(exc)})
            raise JobRepositoryError("Failed to retrieve job posting") from exc

    @staticmethod
    def _get_parsed_job(supabase: Any, job_id: str) -> dict[str, Any] | None:
        result = (
            supabase.table("parsed_jobs")
            .select("*")
            .eq("id", job_id)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        return rows[0] if rows else None

    @staticmethod
    def _to_domain(job_row: dict[str, Any], parsed_row: dict[str, Any] | None) -> JobPosting:
        parsed = parsed_row or {}
        required_skills = _merge_unique_strings(
            job_row.get("requiredSkills"),
            parsed.get("requiredSkills"),
            parsed.get("mustHaveSkills"),
            parsed.get("primarySkills"),
        )
        certifications = _merge_unique_strings(
            job_row.get("certifications"),
            parsed.get("certifications"),
        )

        description = (
            job_row.get("description")
            or job_row.get("pitch")
            or job_row.get("AIGeneratedSummary")
            or ""
        )
        education = (
            job_row.get("educationRequirements")
            or parsed.get("education")
            or None
        )
        experience = job_row.get("experienceRange") or parsed.get("experienceRange")

        return JobPosting(
            job_id=str(job_row.get("id")),
            title=job_row.get("title") or "Untitled Role",
            description=description,
            required_skills=required_skills,
            required_experience=experience,
            education=education,
            certifications=certifications,
        )


def _merge_unique_strings(*values: Any) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for value in values:
        for item in _normalize_string_list(value):
            key = item.lower()
            if key not in seen:
                seen.add(key)
                merged.append(item)
    return merged


def _normalize_string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        stripped = value.strip()
        return [stripped] if stripped else []
    if isinstance(value, list):
        items: list[str] = []
        for item in value:
            if isinstance(item, str) and item.strip():
                items.append(item.strip())
            elif isinstance(item, dict):
                for key in ("name", "title", "skill", "certificationName", "value"):
                    if isinstance(item.get(key), str) and item[key].strip():
                        items.append(item[key].strip())
                        break
        return items
    return []
