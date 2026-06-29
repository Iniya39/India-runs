import os
from supabase import create_client, Client
from dotenv import load_dotenv

# We need to search parent directories for .env because the backend is in a subfolder
# but we'll try standard load_dotenv first
load_dotenv()
# Also try to load from the root folder if running from backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url: str = os.environ.get("VITE_SUPABASE_URL", "")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

# Try to use a service role key if available for backend operations, otherwise fallback to anon
service_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", key)

if not url or not key:
    print("WARNING: Supabase URL or Key not found in environment variables.")

supabase: Client = create_client(url, service_key) if url and service_key else None

def get_supabase():
    if not supabase:
        raise Exception("Supabase client not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
    return supabase
