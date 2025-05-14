# Binventory - Home Inventory Management System

Binventory is a web-based inventory management system designed for home use. It allows you to organize and track your items by areas, containers, bins, and tags.

## Project Structure

- **Backend**: FastAPI + SQLite
- **Frontend**: React + Tailwind CSS

## Getting Started

### Prerequisites

- Python 3.8+ (for backend)
- Node.js 14+ (for frontend)
- npm or yarn (for frontend)

### Setup Backend

1. Navigate to the project root directory:
   ```
   cd /path/to/binventory
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables (create a .env file in the backend directory):
   ```
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   SECRET_KEY=your_secret_key
   ```

5. Run the backend server:
   ```
   cd backend
   python main.py
   ```
   The API server will start on http://localhost:8000

### Setup Frontend

1. Navigate to the frontend directory:
   ```
   cd /path/to/binventory/frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or with yarn
   yarn
   ```

3. Run the development server:
   ```
   npm run dev
   # or with yarn
   yarn dev
   ```
   The frontend will be available at http://localhost:3000

## Features

- **Item Management**: Add, edit, and delete inventory items
- **Organization**: Organize items by areas, containers, and bins
- **Tagging**: Tag items for easy filtering and searching
- **Search**: Search items by name, description, location, or tags
- **Dark Mode**: Toggle between light and dark themes

## API Endpoints

### Authentication
- `GET /api/auth/login`: GitHub OAuth login
- `GET /api/auth/callback`: GitHub OAuth callback

### Items
- `GET /api/items`: List all items with optional filtering
- `POST /api/items`: Create a new item
- `GET /api/items/{item_id}`: Get a specific item
- `PUT /api/items/{item_id}`: Update an item
- `DELETE /api/items/{item_id}`: Delete an item
- `GET /api/search/autocomplete`: Autocomplete search results

### Tags
- `GET /api/tags`: List all tags
- `GET /api/tags/{tag}`: Get details about a specific tag

### Areas/Containers/Bins
- `GET /api/areas`: List all areas
- `GET /api/areas/{area}`: Get details about a specific area
- `GET /api/containers`: List all containers
- `GET /api/containers/{container}`: Get details about a specific container
- `GET /api/bins`: List all bins
- `GET /api/bins/{bin}`: Get details about a specific bin
