# TalentSphere AI Semantic Service

A production-ready Python AI microservice built with **FastAPI** and **Sentence Transformers**. It powers semantic embedding generation, job–candidate similarity scoring, and hybrid candidate ranking for the TalentSphere platform. The service is designed to run alongside the existing Node.js backend and expose lightweight REST APIs on port **8001**.

---

## Project Overview

The microservice provides four public endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Service health and model load status |
| `POST /embed` | Generate a 384-dimensional embedding for a text string |
| `POST /similarity` | Compare a job description with a candidate profile |
| `POST /rank` | Rank multiple candidates using hybrid scoring |

Hybrid ranking combines:

- **Semantic similarity** (45%) — embedding-based profile match
- **Skills match** (20%) — structured skill overlap
- **Project relevance** (15%) — project text similarity
- **Experience match** (10%) — years-of-experience fit
- **Certification score** (5%) — certification relevance
- **Education score** (5%) — education relevance

The SentenceTransformer model (`all-MiniLM-L6-v2` by default) is loaded once at startup and reused for all requests.

---

## Folder Structure

```text
ai/
├── app/
│   ├── __init__.py
│   ├── config.py              # Environment settings and model configuration
│   ├── main.py                # FastAPI app, routes, and startup lifecycle
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── payload.py         # Embedding and similarity request/response schemas
│   │   ├── ranking.py         # Candidate ranking schemas
│   │   └── openapi.py         # OpenAPI schema registration helpers
│   └── services/
│       ├── __init__.py
│       ├── embedding.py       # SentenceTransformer wrapper (singleton)
│       ├── similarity.py      # Semantic similarity service
│       └── ranking.py         # Hybrid candidate ranking engine
├── tests/
│   ├── conftest.py            # Shared fixtures and model mocks
│   ├── ranking_helpers.py     # Shared ranking test utilities
│   ├── test_api.py            # /health, /embed, /similarity tests
│   ├── test_rank_api.py       # /rank integration tests
│   ├── test_ranking_schemas.py
│   └── test_ranking_service.py
├── local_model/               # Optional bundled model artifacts
├── .gitignore
├── pytest.ini
├── README.md
├── requirements.txt
├── run.py                     # Uvicorn entrypoint
└── verify_api.py              # Live endpoint verification script
```

---

## Prerequisites

- **Python 3.8+** (tested with Python 3.11 and 3.14)
- pip
- ~500 MB disk space for dependencies and model cache

---

## Installation

### 1. Navigate to the `ai` directory

```bash
cd ai
```

### 2. Create a virtual environment

**Windows (PowerShell):**

```powershell
python -m venv .venv
```

**Windows (Command Prompt):**

```cmd
python -m venv .venv
```

**Linux / macOS:**

```bash
python3 -m venv .venv
```

### 3. Activate the virtual environment

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**

```cmd
.venv\Scripts\activate.bat
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

### 4. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

For CPU-only systems (smaller install, no GPU required):

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

Test dependencies (`pytest`, `requests`) are included in `requirements.txt`.

---

## Configuration

Create an optional `.env` file in the `ai/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_SERVICE_HOST` | Host address to bind | `0.0.0.0` |
| `AI_SERVICE_PORT` | Port to run the service | `8001` |
| `AI_SERVICE_DEBUG` | Enable auto-reload on code changes | `True` |
| `EMBEDDING_MODEL_NAME` | Hugging Face model name or local path | `sentence-transformers/all-MiniLM-L6-v2` |
| `HF_HOME` | Hugging Face cache directory | System default (`~/.cache/huggingface`) |

Example `.env`:

```env
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8001
AI_SERVICE_DEBUG=True
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
```

---

## Running the FastAPI Server

With the virtual environment activated:

```bash
python run.py
```

The service starts at **http://localhost:8001**.

On first startup, the embedding model is downloaded (~120 MB) and cached. Subsequent starts load from cache.

---

## Running Tests

From the `ai/` directory with the virtual environment activated:

```bash
pytest
```

The suite runs offline using mocked `SentenceTransformer` calls. All **77** tests cover health, embedding, similarity, ranking schemas, ranking service logic, and `/rank` integration scenarios.

Verbose output:

```bash
pytest -v
```

---

## Running the Verification Script

Start the server in one terminal:

```bash
python run.py
```

In a second terminal (with the virtual environment activated):

```bash
python verify_api.py
```

Optional custom base URL:

```bash
python verify_api.py --base-url http://localhost:8001
```

The script verifies all public endpoints and prints a final pass/fail summary.

---

## API Documentation

Interactive Swagger UI:

**http://localhost:8001/docs**

OpenAPI JSON schema:

**http://localhost:8001/openapi.json**

---

## Public API Endpoints

### 1. Health Check — `GET /health`

Verifies the service is running and the embedding model is loaded.

**Sample response:**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "sentence-transformers/all-MiniLM-L6-v2",
  "cache_directory": "C:\\Users\\you\\.cache\\huggingface\\hub",
  "timestamp": 1719878400.12
}
```

---

### 2. Generate Embedding — `POST /embed`

Generates a 384-dimensional semantic embedding for a single text string. CPU-bound work is offloaded to a thread pool.

**Request:**

```json
{
  "text": "Senior Python developer with FastAPI and AWS experience."
}
```

**Response:**

```json
{
  "text": "Senior Python developer with FastAPI and AWS experience.",
  "embedding": [0.0435, -0.0122, 0.0891],
  "dimensions": 384
}
```

> The `embedding` array contains 384 float values; truncated here for readability.

**cURL:**

```bash
curl -X POST http://localhost:8001/embed \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Python developer with FastAPI experience\"}"
```

---

### 3. Semantic Similarity — `POST /similarity`

Compares a job description with a candidate profile and returns a normalized similarity score (0–100).

**Request:**

```json
{
  "job_description": "Senior Python developer with FastAPI and AWS experience.",
  "candidate_profile": "Python engineer with 6 years of FastAPI and cloud experience."
}
```

**Response:**

```json
{
  "semantic_similarity": 88.16
}
```

**cURL:**

```bash
curl -X POST http://localhost:8001/similarity \
  -H "Content-Type: application/json" \
  -d "{\"job_description\": \"Python FastAPI developer\", \"candidate_profile\": \"Python FastAPI engineer\"}"
```

---

### 4. Candidate Ranking — `POST /rank`

Ranks multiple candidates against a job description using hybrid scoring. Results are sorted by `final_score` descending.

**Request:**

```json
{
  "job_description": "Senior Python developer with 5+ years of FastAPI, machine learning, and AWS experience.",
  "candidates": [
    {
      "candidate_id": "cand-001",
      "name": "Priya Sharma",
      "profile": "Senior Python engineer with FastAPI, ML, and AWS experience.",
      "skills": ["Python", "FastAPI", "AWS", "Machine Learning"],
      "projects": ["Talent matching platform using Python and FastAPI"],
      "experience": 6.0,
      "certifications": ["AWS Solutions Architect"],
      "education": "B.Tech in Computer Science"
    },
    {
      "candidate_id": "cand-002",
      "name": "Arjun Patel",
      "profile": "Backend developer with Python and Django experience.",
      "skills": ["Python", "Django"],
      "projects": ["E-commerce REST API"],
      "experience": 4.0,
      "certifications": [],
      "education": "B.Sc Information Technology"
    }
  ]
}
```

**Response:**

```json
{
  "rankings": [
    {
      "candidate_id": "cand-001",
      "name": "Priya Sharma",
      "final_score": 83.82,
      "semantic_similarity": 85.5,
      "skills_match": 90.0,
      "project_relevance": 78.0,
      "experience_match": 100.0,
      "certification_score": 80.0,
      "education_score": 75.0,
      "explanation": "Good semantic alignment, strong skill overlap, relevant project experience, appropriate experience, and strong educational background."
    }
  ]
}
```

**cURL:**

```bash
curl -X POST http://localhost:8001/rank \
  -H "Content-Type: application/json" \
  -d @sample_rank_request.json
```

---

## Integrating with the Node.js Backend

Point your Node.js service at the AI microservice base URL:

```text
http://localhost:8001
```

Typical integration flow:

1. Node.js sends candidate profiles and job descriptions to `POST /rank`
2. AI service returns ranked results with scores and explanations
3. Node.js persists or displays results in the recruiter dashboard

Ensure the AI service is running before the Node.js backend makes ranking requests.

---

## Troubleshooting

### Missing model / model fails to load

**Symptoms:** `/health` returns `"status": "degraded"` and `"model_loaded": false`.

**Fixes:**

- Check internet connectivity on first run (model downloads from Hugging Face)
- Set `EMBEDDING_MODEL_NAME` to a valid model or local path (e.g. `./local_model`)
- Clear a corrupted cache and restart:

  ```bash
  # Windows PowerShell
  Remove-Item -Recurse -Force $env:USERPROFILE\.cache\huggingface

  # Linux / macOS
  rm -rf ~/.cache/huggingface
  ```

- Verify `sentence-transformers` installed correctly: `pip show sentence-transformers`

### Dependency installation issues

**Symptoms:** `pip install` fails on `torch` or `sentence-transformers`.

**Fixes:**

- Upgrade pip: `python -m pip install --upgrade pip`
- Install CPU-only PyTorch first:

  ```bash
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  pip install -r requirements.txt
  ```

- On Windows, use the latest Python 3.11+ installer from python.org if build tools are missing

### Hugging Face cache issues

**Symptoms:** Repeated downloads, disk space errors, or stale model files.

**Fixes:**

- Set an explicit cache directory in `.env`:

  ```env
  HF_HOME=./.cache
  ```

- Delete `ai/.cache` or the system Hugging Face cache and restart the server
- Ensure the cache directory is writable

### Port already in use

**Symptoms:** `OSError: [Errno 98] Address already in use` or Uvicorn fails to bind port 8001.

**Fixes:**

- Change the port in `.env`:

  ```env
  AI_SERVICE_PORT=8002
  ```

- Or stop the process using port 8001:

  ```powershell
  # Windows
  netstat -ano | findstr :8001
  taskkill /PID <pid> /F
  ```

  ```bash
  # Linux / macOS
  lsof -i :8001
  kill <pid>
  ```

### Windows virtual environment issues

**Symptoms:** `Activate.ps1` blocked, wrong Python used, or `python` not found.

**Fixes:**

- Allow script execution (PowerShell, run as needed):

  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

- Use the venv Python directly:

  ```powershell
  .venv\Scripts\python.exe -m pip install -r requirements.txt
  .venv\Scripts\python.exe run.py
  ```

- Confirm activation — your prompt should show `(.venv)`

### Verification script cannot connect

**Symptoms:** `verify_api.py` reports connection errors.

**Fixes:**

- Start the server first: `python run.py`
- Confirm the URL matches: `python verify_api.py --base-url http://localhost:8001`
- Check firewall settings if using a remote host

---

## Quick Start Checklist

```bash
cd ai
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell
pip install -r requirements.txt
pytest                            # Run automated tests
python run.py                     # Start server (separate terminal)
python verify_api.py              # Verify live endpoints
```

Open **http://localhost:8001/docs** to explore all endpoints in Swagger.
