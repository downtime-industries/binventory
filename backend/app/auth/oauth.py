from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
import os
import secrets
from ..schemas import Token, TokenData

# Config
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

# GitHub OAuth setup
config = Config()
config.environ = {
    "GITHUB_CLIENT_ID": os.environ.get("GITHUB_CLIENT_ID", "your-github-client-id"),
    "GITHUB_CLIENT_SECRET": os.environ.get("GITHUB_CLIENT_SECRET", "your-github-client-secret")
}

oauth = OAuth(config)
oauth.register(
    name='github',
    client_id=config.get('GITHUB_CLIENT_ID'),
    client_secret=config.get('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

# Functions for token creation and validation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
        
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    return token_data.username

@router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for('auth_callback')
    return await oauth.github.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def auth_callback(request: Request):
    token = await oauth.github.authorize_access_token(request)
    user = await oauth.github.get('user', token=token)
    user_data = user.json()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data["login"]},
        expires_delta=access_token_expires
    )
    
    # Get frontend URL from environment or use default
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    
    # Redirect to frontend with the token
    from starlette.responses import RedirectResponse
    redirect_url = f"{frontend_url}/login?access_token={access_token}"
    return RedirectResponse(url=redirect_url)
