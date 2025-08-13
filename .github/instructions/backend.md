---
applyTo: "backend/**/*"
---

# Binventory Backend Development Guide

## Stack Overview

The Binventory backend uses:
- **FastAPI**: For API endpoints and request handling
- **SQLite**: As the database engine
- **SQLAlchemy**: For ORM and database operations
- **Pydantic**: For data validation and schema definitions
- **Model Context Protocol (MCP)**: For AI tool interactions with the API

## Project Structure

```
backend/
├── app/
│   ├── main.py          # Main FastAPI application
│   ├── mcp.py           # MCP server implementation
│   ├── auth/            # Authentication modules
│   ├── database/        # Database connection and initialization
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # API endpoints
│   └── schemas/         # Pydantic schemas
└── main.py              # Entry point
```

## Database

- SQLite database is stored in `binventory.db`
- Database schema includes tables for:
  - `items`: Main inventory items
  - `items_tags`: Tags associated with items
  - `items_fts`: Full-text search index for items

## Authentication

- GitHub OAuth is used for authentication
- JWT tokens are generated after OAuth authentication
- Protected routes use `get_current_user` dependency

## API Endpoints

### Items
- `GET /api/items`: List items with filtering and pagination
- `POST /api/items`: Create new item
- `GET /api/items/{item_id}`: Get item details
- `PUT /api/items/{item_id}`: Update item
- `DELETE /api/items/{item_id}`: Delete item

### Containers
- `GET /api/areas`: List areas
- `GET /api/containers`: List containers
- `GET /api/bins`: List bins
- `GET /api/areas/{area}`: Get area details
- `GET /api/containers/{container}`: Get container details
- `GET /api/bins/{bin}`: Get bin details

### Tags
- `GET /api/tags`: List all tags
- `GET /api/tags/{tag}`: Get tag details

### Search
- `GET /api/search/autocomplete`: Search autocomplete

### MCP Endpoints
- `/api/mcp/move_item`: Move item to a different bin
- `/api/mcp/update_quantity`: Update item quantity
- `/api/mcp/find_item`: Find items matching search query

## Development Guidelines

1. **Running the server**:
   ```bash
   cd backend
   python main.py
   ```
   Or for development with auto-reload:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Database migrations**:
   - Changes to models should be reflected in `database/init_db.py`
   - The application automatically creates tables on startup if they don't exist

3. **Authentication**:
   - Set environment variables for GitHub OAuth:
     - `GITHUB_CLIENT_ID`
     - `GITHUB_CLIENT_SECRET`
     - `SECRET_KEY` (for JWT)

4. **Adding new endpoints**:
   - Create route functions in appropriate files under `routes/`
   - Register routes in `main.py` with proper prefix and tags
   - Add Pydantic models in `schemas/` as needed

5. **MCP Integration**:
   - Use the `fastapi_mcp` library for tool definitions
   - Define tools as async functions with appropriate type hints
   - Register tools using the `@mcp.tool()` decorator

## Testing

- API endpoints can be automatically tested through FastAPI's built-in Swagger UI at `/docs` endpoint
- Interactive API documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc)
- Unit tests should be added for critical functionality
