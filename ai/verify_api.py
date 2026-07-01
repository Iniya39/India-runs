"""
TalentSphere AI microservice verification script.

Verifies all public endpoints against a running FastAPI instance:
  - GET  /health
  - POST /embed
  - POST /similarity
  - POST /rank

Usage:
    python verify_api.py
    python verify_api.py --base-url http://localhost:8001
"""

from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass, field

import requests

DEFAULT_BASE_URL = "http://localhost:8001"
SEPARATOR = "-" * 60

COMPONENT_SCORE_FIELDS = (
    "semantic_similarity",
    "skills_match",
    "project_relevance",
    "experience_match",
    "certification_score",
    "education_score",
)


@dataclass
class EndpointResult:
    name: str
    passed: bool
    status_code: int | None = None
    response_time_ms: float | None = None
    details: list[str] = field(default_factory=list)
    error: str | None = None


def print_separator() -> None:
    print(SEPARATOR)


def timed_request(method: str, url: str, **kwargs) -> tuple[requests.Response, float]:
    start = time.time()
    response = requests.request(method, url, **kwargs)
    elapsed_ms = (time.time() - start) * 1000
    return response, elapsed_ms


def print_endpoint_header(endpoint: str) -> None:
    print(f"Testing {endpoint} ...")


def print_common_result(result: EndpointResult) -> None:
    if result.status_code is not None:
        print(f"Status Code:   {result.status_code}")
    if result.response_time_ms is not None:
        print(f"Response Time: {result.response_time_ms:.2f} ms")
    for line in result.details:
        print(line)
    if result.error:
        print(f"Error:         {result.error}")
    print(f"Result:         {'SUCCESS' if result.passed else 'FAILED'}")


def verify_health(base_url: str) -> EndpointResult:
    endpoint = "GET /health"
    result = EndpointResult(name=endpoint, passed=False)
    print_endpoint_header(endpoint)

    try:
        response, elapsed = timed_request("GET", f"{base_url}/health", timeout=15)
        result.status_code = response.status_code
        result.response_time_ms = elapsed

        if response.status_code != 200:
            result.error = f"Unexpected HTTP {response.status_code}"
            return result

        data = response.json()
        status = data.get("status")
        model_loaded = data.get("model_loaded")
        model_name = data.get("model_name")

        result.details.extend(
            [
                f"Service Status: {status}",
                f"Model Loaded:   {model_loaded}",
                f"Model Name:     {model_name}",
            ]
        )
        result.passed = status == "healthy" and model_loaded is True
        if not result.passed:
            result.error = "Service unhealthy or embedding model not loaded"
    except requests.exceptions.ConnectionError:
        result.error = "Could not connect to server. Is it running?"
    except Exception as exc:
        result.error = str(exc)

    print_common_result(result)
    return result


def verify_embed(base_url: str) -> EndpointResult:
    endpoint = "POST /embed"
    result = EndpointResult(name=endpoint, passed=False)
    print_endpoint_header(endpoint)

    payload = {"text": "Python developer with FastAPI and AWS experience"}

    try:
        response, elapsed = timed_request(
            "POST", f"{base_url}/embed", json=payload, timeout=30
        )
        result.status_code = response.status_code
        result.response_time_ms = elapsed

        if response.status_code != 200:
            result.error = response.text
            return result

        data = response.json()
        dimensions = data.get("dimensions")
        embedding = data.get("embedding", [])
        preview = embedding[:5] if isinstance(embedding, list) else []

        result.details.extend(
            [
                f"Input Text:     {payload['text'][:60]}{'...' if len(payload['text']) > 60 else ''}",
                f"Dimensions:     {dimensions}",
                f"Embedding (1-5): {preview}",
            ]
        )
        result.passed = dimensions == 384 and len(embedding) == 384
        if not result.passed:
            result.error = f"Expected 384-dimensional embedding, got {len(embedding)}"
    except requests.exceptions.ConnectionError:
        result.error = "Could not connect to server. Is it running?"
    except Exception as exc:
        result.error = str(exc)

    print_common_result(result)
    return result


def verify_similarity(base_url: str) -> EndpointResult:
    endpoint = "POST /similarity"
    result = EndpointResult(name=endpoint, passed=False)
    print_endpoint_header(endpoint)

    samples = [
        {
            "label": "Strong match",
            "payload": {
                "job_description": (
                    "Senior Python developer with 5+ years of experience in FastAPI, "
                    "machine learning, and cloud deployment on AWS."
                ),
                "candidate_profile": (
                    "Experienced Python engineer skilled in FastAPI, ML pipelines, "
                    "and AWS infrastructure with 6 years in backend development."
                ),
            },
        },
        {
            "label": "Identical text",
            "payload": {
                "job_description": "Python developer with FastAPI and AWS experience.",
                "candidate_profile": "Python developer with FastAPI and AWS experience.",
            },
        },
        {
            "label": "Unrelated profiles",
            "payload": {
                "job_description": (
                    "Senior Python developer with 5+ years of experience in FastAPI, "
                    "machine learning, and cloud deployment on AWS."
                ),
                "candidate_profile": (
                    "Professional pastry chef specializing in French desserts, "
                    "sourdough baking, and restaurant kitchen management."
                ),
            },
        },
    ]

    sample_results: list[tuple[str, float | None, bool]] = []
    total_elapsed = 0.0
    all_ok = True

    try:
        for sample in samples:
            response, elapsed = timed_request(
                "POST",
                f"{base_url}/similarity",
                json=sample["payload"],
                timeout=30,
            )
            total_elapsed += elapsed
            result.status_code = response.status_code

            if response.status_code != 200:
                all_ok = False
                sample_results.append((sample["label"], None, False))
                continue

            score = response.json().get("semantic_similarity")
            valid = isinstance(score, (int, float)) and 0.0 <= score <= 100.0
            sample_results.append((sample["label"], float(score), valid))
            all_ok = all_ok and valid

        result.response_time_ms = total_elapsed
        for label, score, ok in sample_results:
            status = f"{score}%" if score is not None else "N/A"
            result.details.append(
                f"  {label}: semantic_similarity={status} ({'ok' if ok else 'invalid'})"
            )

        result.passed = all_ok and result.status_code == 200
        if not result.passed:
            result.error = "One or more similarity samples failed validation"
    except requests.exceptions.ConnectionError:
        result.error = "Could not connect to server. Is it running?"
    except Exception as exc:
        result.error = str(exc)

    print_common_result(result)
    return result


def verify_rank(base_url: str) -> EndpointResult:
    endpoint = "POST /rank"
    result = EndpointResult(name=endpoint, passed=False)
    print_endpoint_header(endpoint)

    payload = {
        "job_description": (
            "Senior Python developer with 5+ years of experience in FastAPI, "
            "machine learning, and AWS. Bachelor's in Computer Science preferred. "
            "AWS Solutions Architect certification is a plus."
        ),
        "candidates": [
            {
                "candidate_id": "cand-strong",
                "name": "Priya Sharma",
                "profile": (
                    "Senior Python engineer with 6 years building FastAPI backends, "
                    "ML pipelines, and AWS cloud services."
                ),
                "skills": ["Python", "FastAPI", "AWS", "Machine Learning"],
                "projects": ["Talent matching platform using Python, FastAPI, and AWS"],
                "experience": 6.0,
                "certifications": ["AWS Solutions Architect"],
                "education": "B.Tech in Computer Science",
            },
            {
                "candidate_id": "cand-moderate",
                "name": "Arjun Patel",
                "profile": "Backend developer with Python and Django experience on cloud platforms.",
                "skills": ["Python", "Django", "AWS"],
                "projects": ["E-commerce API built with Python and Django"],
                "experience": 4.0,
                "certifications": [],
                "education": "B.Sc in Information Technology",
            },
            {
                "candidate_id": "cand-weak",
                "name": "Marie Dubois",
                "profile": "Professional pastry chef specializing in French desserts and bakery management.",
                "skills": ["Baking", "Pastry"],
                "projects": ["Artisan sourdough bakery operations"],
                "experience": 4.0,
                "certifications": ["Culinary Arts Diploma"],
                "education": "Diploma in Culinary Arts",
            },
        ],
    }

    try:
        response, elapsed = timed_request(
            "POST", f"{base_url}/rank", json=payload, timeout=120
        )
        result.status_code = response.status_code
        result.response_time_ms = elapsed

        if response.status_code != 200:
            result.error = response.text
            return result

        rankings = response.json().get("rankings", [])
        if len(rankings) != 3:
            result.error = f"Expected 3 rankings, got {len(rankings)}"
            return result

        scores = [item["final_score"] for item in rankings]
        if scores != sorted(scores, reverse=True):
            result.error = "Rankings are not sorted by final_score descending"
            return result

        result.details.append("Ranking Order:")
        for index, ranked in enumerate(rankings, start=1):
            result.details.append(
                f"  {index}. {ranked['name']} ({ranked['candidate_id']})"
            )
            result.details.append(f"     Final Score:          {ranked['final_score']}%")
            result.details.append(
                f"     Semantic Similarity:  {ranked['semantic_similarity']}%"
            )
            result.details.append(
                "     Component Scores:     "
                + ", ".join(
                    f"{field}={ranked[field]}%"
                    for field in COMPONENT_SCORE_FIELDS
                    if field != "semantic_similarity"
                )
            )
            result.details.append(f"     Explanation:          {ranked['explanation']}")

        top_id = rankings[0]["candidate_id"]
        bottom_id = rankings[-1]["candidate_id"]
        result.passed = top_id == "cand-strong" and bottom_id == "cand-weak"
        if not result.passed:
            result.error = (
                f"Unexpected ranking order (top={top_id}, bottom={bottom_id})"
            )
    except requests.exceptions.ConnectionError:
        result.error = "Could not connect to server. Is it running?"
    except Exception as exc:
        result.error = str(exc)

    print_common_result(result)
    return result


def verify_swagger(base_url: str) -> EndpointResult:
    endpoint = "Swagger / OpenAPI"
    result = EndpointResult(name=endpoint, passed=False)
    print_endpoint_header(endpoint)

    required_paths = {
        "/health": "get",
        "/embed": "post",
        "/similarity": "post",
        "/rank": "post",
    }
    required_schemas = {
        "EmbeddingRequest",
        "EmbeddingResponse",
        "SemanticSimilarityRequest",
        "SemanticSimilarityResponse",
        "RankingRequest",
        "RankingResponse",
        "Candidate",
        "RankedCandidate",
    }

    try:
        response, elapsed = timed_request("GET", f"{base_url}/openapi.json", timeout=15)
        result.status_code = response.status_code
        result.response_time_ms = elapsed

        if response.status_code != 200:
            result.error = f"Could not fetch OpenAPI schema (HTTP {response.status_code})"
            return result

        schema = response.json()
        paths = schema.get("paths", {})
        components = schema.get("components", {}).get("schemas", {})

        missing_paths = [
            f"{method.upper()} {path}"
            for path, method in required_paths.items()
            if method not in paths.get(path, {})
        ]
        missing_schemas = sorted(required_schemas - set(components))

        result.details.append(f"Docs URL:       {base_url}/docs")
        result.details.append(f"OpenAPI URL:    {base_url}/openapi.json")
        result.details.append(f"Paths Found:    {len(paths)}")
        result.details.append(f"Schemas Found:  {len(components)}")

        if missing_paths:
            result.details.append(f"Missing Paths:  {', '.join(missing_paths)}")
        if missing_schemas:
            result.details.append(f"Missing Schemas: {', '.join(missing_schemas)}")

        result.passed = not missing_paths and not missing_schemas
        if not result.passed:
            result.error = "Swagger documentation is incomplete"
    except requests.exceptions.ConnectionError:
        result.error = "Could not connect to server. Is it running?"
    except Exception as exc:
        result.error = str(exc)

    print_common_result(result)
    return result


def print_summary(results: list[EndpointResult]) -> bool:
    print_separator()
    print("VERIFICATION SUMMARY")
    print_separator()
    print(f"{'Endpoint':<22} {'Status':<10} {'HTTP':<6} {'Time (ms)':<12} Details")
    print("-" * 60)

    all_passed = True
    for item in results:
        all_passed = all_passed and item.passed
        status = "PASS" if item.passed else "FAIL"
        http = str(item.status_code) if item.status_code is not None else "-"
        elapsed = f"{item.response_time_ms:.2f}" if item.response_time_ms is not None else "-"
        detail = item.error or (item.details[0] if item.details else "")
        if len(detail) > 40:
            detail = detail[:37] + "..."
        print(f"{item.name:<22} {status:<10} {http:<6} {elapsed:<12} {detail}")

    print_separator()
    if all_passed:
        print("Overall Status: ALL ENDPOINTS PASSED SUCCESSFULLY")
    else:
        failed = [item.name for item in results if not item.passed]
        print(f"Overall Status: FAILED ({len(failed)} check(s) failed: {', '.join(failed)})")
    print_separator()
    return all_passed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify TalentSphere AI microservice endpoints.")
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"Base URL of the running service (default: {DEFAULT_BASE_URL})",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    base_url = args.base_url.rstrip("/")

    print_separator()
    print("TalentSphere AI Service Verification")
    print(f"Target URL: {base_url}")
    print_separator()

    results = [
        verify_health(base_url),
    ]
    print_separator()
    results.append(verify_embed(base_url))
    print_separator()
    results.append(verify_similarity(base_url))
    print_separator()
    results.append(verify_rank(base_url))
    print_separator()
    results.append(verify_swagger(base_url))

    passed = print_summary(results)
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
