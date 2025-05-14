from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from .auth.oauth import get_current_user
from .routes import items, tags, containers
from .database.init_db import create_db_and_tables
import secrets

app = FastAPI(title="Binventory API")

# Configure CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add session middleware - required for OAuth authentication
app.add_middleware(
    SessionMiddleware, 
    secret_key=secrets.token_urlsafe(32)
)

# Include routers
app.include_router(items.router, prefix="/api", tags=["Items"])
app.include_router(tags.router, prefix="/api", tags=["Tags"])
app.include_router(containers.router, prefix="/api", tags=["Containers"])

# Include authentication router
from .auth.oauth import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

# Get static files directory from environment or use default
static_files_dir = os.environ.get("STATIC_FILES_DIR", "../static")

# Serve static files if directory exists
if os.path.exists(static_files_dir):
    app.mount("/assets", StaticFiles(directory=f"{static_files_dir}/assets"), name="assets")
    
    @app.get("/{path:path}", include_in_schema=False)
    async def serve_frontend(path: str):
        # Return the index.html for any frontend routes
        index_path = f"{static_files_dir}/index.html"
        if os.path.exists(f"{static_files_dir}/{path}"):
            return FileResponse(f"{static_files_dir}/{path}")
        elif os.path.exists(index_path):
            return FileResponse(index_path)
        else:
            raise HTTPException(status_code=404, detail="Resource not found")

@app.on_event("startup")
async def on_startup():
    # Create tables on startup
    await create_db_and_tables()

@app.get("/api/healthcheck", tags=["Health"])
async def healthcheck():
    return {"status": "ok"}
