import os
import dotenv
from pathlib import Path

# Find the .env file in the project root
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env'

# Load environment variables from .env file
if env_path.exists():
    print(f"Loading environment variables from {env_path}")
    dotenv.load_dotenv(env_path)
else:
    print("Warning: .env file not found")

# Check if GitHub OAuth credentials are properly set
github_client_id = os.environ.get('GITHUB_CLIENT_ID')
github_client_secret = os.environ.get('GITHUB_CLIENT_SECRET')

if not github_client_id or github_client_id == 'your-github-client-id':
    print("Warning: GITHUB_CLIENT_ID is not properly set")

if not github_client_secret or github_client_secret == 'your-github-client-secret':
    print("Warning: GITHUB_CLIENT_SECRET is not properly set")
