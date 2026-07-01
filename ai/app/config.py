import os
from dotenv import load_dotenv

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load environmental variables from standard places
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

# App Configurations
HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_SERVICE_PORT", "8001"))
DEBUG = os.getenv("AI_SERVICE_DEBUG", "True").lower() in ("true", "1", "t", "y", "yes")

# Model Configurations
MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

# Hugging Face Home (Cache location)
# We respect the environment's HF_HOME if set. If not set, we let sentence-transformers
# use its default system cache location (typically ~/.cache/huggingface), which avoids
# redownloading the model if it is already cached on the system.
HF_HOME = os.getenv("HF_HOME")
if HF_HOME:
    os.environ["HF_HOME"] = HF_HOME
    os.environ["SENTENCE_TRANSFORMERS_HOME"] = os.path.join(HF_HOME, "sentence_transformers")
else:
    # Set cache directory to default HF location info for health endpoint reporting
    # Typically home folder/.cache/huggingface/hub on Linux/Mac or UserProfile/.cache/huggingface/hub on Windows
    HF_HOME = os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub")

