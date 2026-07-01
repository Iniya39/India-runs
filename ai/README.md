# TalentSphere AI Semantic Service

A dedicated Python AI microservice built with **FastAPI** to handle embedding generation and semantic matching. This service automatically loads and caches the `sentence-transformers/all-MiniLM-L6-v2` model locally on its first execution and serves it via lightweight REST APIs.

---

## Folder Structure

```text
ai/
├── app/
│   ├── __init__.py
│   ├── config.py          # Environment settings, cache configuration
│   ├── main.py            # FastAPI application routing and startup
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── payload.py     # Pydantic request/response validation schemas
│   └── services/
│       ├── __init__.py
│       └── embedding.py   # SentenceTransformer model wrapper and logic
├── .gitignore             # Exclude .venv and Hugging Face model cache
├── README.md              # Documentation
├── requirements.txt       # Dependencies
└── run.py                 # Startup entrypoint script
```

---

## Installation & Setup

Ensure you have **Python 3.8+** installed. (Tested with Python 3.11).

1. **Navigate to the `ai` directory:**
   ```bash
   cd ai
   ```

2. **Create a virtual environment:**
   * On Windows:
     ```bash
     python -m venv .venv
     ```
   * On Linux/macOS:
     ```bash
     python3 -m venv .venv
     ```

3. **Activate the virtual environment:**
   * On Windows (Command Prompt):
     ```cmd
     .venv\Scripts\activate.bat
     ```
   * On Windows (PowerShell):
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * On Linux/macOS:
     ```bash
     source .venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *Note: On systems without GPUs, installing standard cpu-only PyTorch can save significant disk space:*
   ```bash
   pip install torch --index-url https://download.pytorch.org/whl/cpu
   pip install -r requirements.txt
   ```

---

## Configuration

Configurations can be customized using `.env` file in the root of the `ai/` folder:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `AI_SERVICE_HOST` | Host address to bind the server | `0.0.0.0` |
| `AI_SERVICE_PORT` | Port to run the service | `8001` |
| `AI_SERVICE_DEBUG` | Run FastAPI with reload enabled | `True` |
| `EMBEDDING_MODEL_NAME` | Hugging Face model name | `sentence-transformers/all-MiniLM-L6-v2` |
| `HF_HOME` | Model cache storage folder path | `./.cache` (inside `ai/`) |

---

## Running the Service

While in the `ai` directory with the virtual environment activated, run:

```bash
python run.py
```

The service will start at `http://localhost:8001`. On the first startup, it will automatically download the `sentence-transformers/all-MiniLM-L6-v2` model files (about 120MB) and cache them in the `ai/.cache` directory. Subsequent starts will load from cache instantly.

---

## API Documentation

Interactive OpenAPI docs are available at `http://localhost:8001/docs`.

### 1. Health & Status
Checks if the server is healthy and verifies if the embedding model is loaded.

* **URL:** `/health`
* **Method:** `GET`
* **Response Example:**
  ```json
  {
    "status": "healthy",
    "model_loaded": true,
    "model_name": "sentence-transformers/all-MiniLM-L6-v2",
    "cache_directory": "c:\\Users\\HP\\TalentSphere\\ai\\.cache"
  }
  ```

### 2. Generate Single Embedding
Generates a 384-dimensional vector embedding for a single string.

* **URL:** `/api/embeddings`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
  ```json
  {
    "text": "Senior frontend developer with 5+ years of React experience."
  }
  ```
* **Response Example:**
  ```json
  {
    "text": "Senior frontend developer with 5+ years of React experience.",
    "embedding": [0.0435, -0.0122, 0.0891, ...],
    "dimensions": 384
  }
  ```

### 3. Generate Batch Embeddings
Generates vector embeddings for a list of string values.

* **URL:** `/api/embeddings/batch`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
  ```json
  {
    "texts": [
      "React Developer",
      "Python AI Engineer"
    ]
  }
  ```
* **Response Example:**
  ```json
  {
    "texts": [
      "React Developer",
      "Python AI Engineer"
    ],
    "embeddings": [
      [0.0121, -0.0543, ...],
      [-0.0342, 0.0911, ...]
    ],
    "dimensions": 384
  }
  ```
