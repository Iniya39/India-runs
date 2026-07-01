import sys
from unittest.mock import MagicMock

# Allow tests to import backend modules without optional runtime dependencies installed.
if "supabase" not in sys.modules:
    supabase_mock = MagicMock()
    supabase_mock.create_client.return_value = MagicMock()
    sys.modules["supabase"] = supabase_mock
