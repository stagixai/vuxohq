import sys
from pathlib import Path

# Ensure root directory is on Python path for Vercel serverless environment
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from main import app

__all__ = ["app"]
