import uvicorn
import os
import dotenv
from pathlib import Path

# Load environment variables from .env file
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'

if env_path.exists():
    print(f"Loading environment variables from {env_path}")
    dotenv.load_dotenv(env_path)
else:
    print("Warning: .env file not found")

# Import the app after environment variables are loaded
from app.main import app

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
