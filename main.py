from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import sqlite3
import os
import re
from urllib.parse import unquote

app = FastAPI()

# Setup templates and static files
templates = Jinja2Templates(directory="templates")

# Add custom filter for truncating text
def truncate_text(text, length=100):
    """Truncate text to specified length and append ellipsis if needed"""
    if not text or len(text) <= length:
        return text
    return text[:length].rstrip() + "..."
    
# Register the filter with Jinja2
templates.env.filters["truncate_text"] = truncate_text

# Location validation pattern - prohibit characters that would break URLs
INVALID_LOCATION_PATTERN = r'[/\\?%*:|"<>\n\r\t]'

def validate_location(value: str) -> str:
    """
    Validate that a location name doesn't contain characters that would
    break the URL structure or create security issues
    """
    if value and re.search(INVALID_LOCATION_PATTERN, value):
        raise HTTPException(
            status_code=400, 
            detail="Location fields cannot contain the following characters: / \\ ? % * : | \" < >"
        )
    return value

app.mount("/static", StaticFiles(directory="static"), name="static")

# Ensure database exists
os.makedirs("data", exist_ok=True)
db_path = "data/inventory.db"

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Create main items table
c.execute("""
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    area TEXT,
    container TEXT,
    bin TEXT,
    quantity INTEGER DEFAULT 1,
    url TEXT
);
""")

# Create FTS5 table for searching name + description
c.execute("""
CREATE VIRTUAL TABLE IF NOT EXISTS item_fts USING fts5(
    name, 
    description,
    area,
    container, 
    bin,
    content='items', 
    content_rowid='id',
    tokenize='porter'
);
""")

# Trigger to sync inserts
c.execute("""
CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
    INSERT INTO item_fts(rowid, name, description, area, container, bin) 
    VALUES (new.id, new.name, new.description, new.area, new.container, new.bin);
END;
""")

# Trigger to sync updates
c.execute("""
CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
    UPDATE item_fts 
    SET name = new.name, 
        description = new.description,
        area = new.area,
        container = new.container,
        bin = new.bin
    WHERE rowid = new.id;
END;
""")

# Trigger to sync deletes
c.execute("""
CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
    DELETE FROM item_fts WHERE rowid = old.id;
END;
""")

conn.commit()

# Rebuild FTS index to ensure all existing fields are indexed
try:
    # Drop the old FTS table first if it exists
    c.execute("DROP TABLE IF EXISTS item_fts")
    conn.commit()
    
    # Recreate the FTS table with all fields
    c.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS item_fts USING fts5(
        name, 
        description,
        area,
        container, 
        bin,
        content='items', 
        content_rowid='id',
        tokenize='porter'
    );
    """)
    
    # Populate the FTS table with existing data
    c.execute("""
    INSERT INTO item_fts(rowid, name, description, area, container, bin)
    SELECT id, name, description, area, container, bin FROM items
    """)
    conn.commit()
except Exception as e:
    print(f"Error rebuilding FTS index: {e}")

conn.close()

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    conn = sqlite3.connect(db_path)
    items = conn.execute("SELECT * FROM items").fetchall()
    conn.close()
    return templates.TemplateResponse("index.html", {"request": request, "items": items})

@app.post("/add")
def add_item(
    name: str = Form(...),
    description: str = Form(""),
    area: str = Form(""),
    container: str = Form(""),
    bin: str = Form(""),
    quantity: int = Form(1),
    url: str = Form("")
):
    # Validate location fields
    area = validate_location(area)
    container = validate_location(container)
    bin = validate_location(bin)
    
    conn = sqlite3.connect(db_path)
    conn.execute("""
        INSERT INTO items (name, description, area, container, bin, quantity, url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name, description, area, container, bin, quantity, url))
    conn.commit()
    conn.close()
    return RedirectResponse(url="/", status_code=303)

@app.get("/search", response_class=HTMLResponse)
def search(request: Request, q: str = ""):
    conn = sqlite3.connect(db_path)
    results = []
    match_info = {}
    
    if q:
        q_lower = q.lower()
        like_pattern = f"%{q_lower}%"
        
        # Use case-insensitive LIKE query with LOWER() function
        results = conn.execute("""
            SELECT * FROM items
            WHERE LOWER(name) LIKE ? 
               OR LOWER(description) LIKE ? 
               OR LOWER(area) LIKE ? 
               OR LOWER(container) LIKE ? 
               OR LOWER(bin) LIKE ?
        """, (like_pattern, like_pattern, like_pattern, like_pattern, like_pattern)).fetchall()
        
        # For each result, determine which fields matched
        for item in results:
            item_id = item[0]
            matched_fields = []
            
            # Check each field for the search term (case-insensitive)
            if item[1] and q_lower in item[1].lower():  # name
                matched_fields.append("name")
            if item[2] and item[2] and q_lower in item[2].lower():  # description
                matched_fields.append("description")
            if item[3] and item[3] and q_lower in item[3].lower():  # area
                matched_fields.append("area")
            if item[4] and item[4] and q_lower in item[4].lower():  # container
                matched_fields.append("container")
            if item[5] and item[5] and q_lower in item[5].lower():  # bin
                matched_fields.append("bin")
            
            match_info[item_id] = matched_fields
    
    conn.close()
    return templates.TemplateResponse("search.html", {
        "request": request, 
        "items": results, 
        "query": q,
        "match_info": match_info
    })


@app.get("/api/search-suggestions")
def get_search_suggestions():
    conn = sqlite3.connect(db_path)
    # Get item names and descriptions for search suggestions
    items = conn.execute("SELECT name, description FROM items").fetchall()
    
    # Get unique areas, containers, and bins
    areas = [row[0] for row in conn.execute("SELECT DISTINCT area FROM items WHERE area != ''").fetchall()]
    containers = [row[0] for row in conn.execute("SELECT DISTINCT container FROM items WHERE container != ''").fetchall()]
    bins = [row[0] for row in conn.execute("SELECT DISTINCT bin FROM items WHERE bin != ''").fetchall()]
    conn.close()
    
    # Combine names and unique words from descriptions
    suggestions = []
    for name, description in items:
        suggestions.append(name)
        if description:
            # Extract useful words from descriptions (4+ characters)
            words = [word for word in description.split() if len(word) >= 4]
            suggestions.extend(words)
    
    # Add areas, containers, and bins as potential search terms
    suggestions.extend(areas)
    suggestions.extend(containers)
    suggestions.extend(bins)
    
    # Remove duplicates and sort
    unique_suggestions = list(set(suggestions))
    unique_suggestions.sort()
    
    return {"suggestions": unique_suggestions}

@app.get("/add", response_class=HTMLResponse)
def add_item_form(request: Request):
    # Creating an empty "item" with default values for the template
    item = [None, "", "", "", "", "", 1, ""]  # id, name, description, area, container, bin, quantity, url
    
    return templates.TemplateResponse("edit.html", {
        "request": request,
        "item": item,
        "item_id": "new",  # Special identifier for new items
        "is_new": True
    })

@app.get("/edit/{item_id}", response_class=HTMLResponse)
def edit_item_form(request: Request, item_id: int):
    conn = sqlite3.connect(db_path)
    item = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    conn.close()
    
    if not item:
        return RedirectResponse(url="/", status_code=303)
        
    return templates.TemplateResponse("edit.html", {
        "request": request,
        "item": item,
        "item_id": item_id
    })

@app.post("/edit/{item_id}")
def update_item(
    item_id: int,
    name: str = Form(...),
    description: str = Form(""),
    area: str = Form(""),
    container: str = Form(""),
    bin: str = Form(""),
    quantity: int = Form(1),
    url: str = Form("")
):
    conn = sqlite3.connect(db_path)
    conn.execute("""
        UPDATE items 
        SET name = ?, description = ?, area = ?, container = ?, bin = ?, quantity = ?, url = ?
        WHERE id = ?
    """, (name, description, area, container, bin, quantity, url, item_id))
    conn.commit()
    conn.close()
    
    return RedirectResponse(url="/", status_code=303)

@app.get("/api/locations")
def get_locations():
    conn = sqlite3.connect(db_path)
    # Get unique areas, containers, and bins from the database
    areas = [row[0] for row in conn.execute("SELECT DISTINCT area FROM items WHERE area != ''").fetchall()]
    containers = [row[0] for row in conn.execute("SELECT DISTINCT container FROM items WHERE container != ''").fetchall()]
    bins = [row[0] for row in conn.execute("SELECT DISTINCT bin FROM items WHERE bin != ''").fetchall()]
    conn.close()
    
    return {
        "areas": areas,
        "containers": containers,
        "bins": bins
    }

@app.post("/delete/{item_id}")
def delete_item(item_id: int):
    conn = sqlite3.connect(db_path)
    conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    
    return RedirectResponse(url="/", status_code=303)

# New location routes to handle area, container, and bin navigation
@app.get("/location/{area}", response_class=HTMLResponse)
def view_area(request: Request, area: str):
    # URL decode the area parameter
    area_decoded = unquote(area)
    
    conn = sqlite3.connect(db_path)
    
    # Get items in this area using case-insensitive comparison
    items = conn.execute("""
        SELECT * FROM items 
        WHERE LOWER(area) = LOWER(?) 
        ORDER BY container, bin, name
    """, (area_decoded,)).fetchall()
    
    # Get stats for this area
    total_items = len(items)
    total_quantity = sum(item[6] or 0 for item in items)
    
    # Get unique containers in this area for sub-location navigation
    containers_query = conn.execute("""
        SELECT container, COUNT(*) as count 
        FROM items 
        WHERE LOWER(area) = LOWER(?) AND container != '' 
        GROUP BY container 
        ORDER BY container
    """, (area_decoded,)).fetchall()
    
    # Format container data for template
    sub_locations = []
    for container, count in containers_query:
        sub_locations.append({
            "name": container,
            "count": count,
            "url": f"/location/{area}/{container}"
        })
    
    conn.close()
    
    stats = {
        "total_items": total_items,
        "total_quantity": total_quantity,
        "unique_locations": len(sub_locations)
    }
    
    return templates.TemplateResponse("location.html", {
        "request": request,
        "title": f"Area: {area_decoded}",
        "area": area_decoded,
        "items": items,
        "sub_locations": sub_locations,
        "stats": stats
    })

@app.get("/location/{area}/{container}", response_class=HTMLResponse)
def view_container(request: Request, area: str, container: str):
    # URL decode parameters
    area_decoded = unquote(area)
    container_decoded = unquote(container)
    
    conn = sqlite3.connect(db_path)
    
    # Get items in this container using case-insensitive comparison
    items = conn.execute("""
        SELECT * FROM items 
        WHERE LOWER(area) = LOWER(?) AND LOWER(container) = LOWER(?) 
        ORDER BY bin, name
    """, (area_decoded, container_decoded)).fetchall()
    
    # Get stats for this container
    total_items = len(items)
    total_quantity = sum(item[6] or 0 for item in items)
    
    # Get unique bins in this container for sub-location navigation
    bins_query = conn.execute("""
        SELECT bin, COUNT(*) as count 
        FROM items 
        WHERE LOWER(area) = LOWER(?) AND LOWER(container) = LOWER(?) AND bin != '' 
        GROUP BY bin 
        ORDER BY bin
    """, (area_decoded, container_decoded)).fetchall()
    
    # Format bin data for template
    sub_locations = []
    for bin_name, count in bins_query:
        sub_locations.append({
            "name": bin_name,
            "count": count,
            "url": f"/location/{area}/{container}/{bin_name}"
        })
    
    conn.close()
    
    stats = {
        "total_items": total_items,
        "total_quantity": total_quantity,
        "unique_locations": len(sub_locations)
    }
    
    return templates.TemplateResponse("location.html", {
        "request": request,
        "title": f"Container: {container_decoded}",
        "area": area_decoded,
        "container": container_decoded,
        "items": items,
        "sub_locations": sub_locations,
        "stats": stats
    })

@app.get("/location/{area}/{container}/{bin}", response_class=HTMLResponse)
def view_bin(request: Request, area: str, container: str, bin: str):
    # URL decode parameters
    area_decoded = unquote(area)
    container_decoded = unquote(container)
    bin_decoded = unquote(bin)
    
    conn = sqlite3.connect(db_path)
    
    # Get items in this bin using case-insensitive comparison
    items = conn.execute("""
        SELECT * FROM items 
        WHERE LOWER(area) = LOWER(?) AND LOWER(container) = LOWER(?) AND LOWER(bin) = LOWER(?) 
        ORDER BY name
    """, (area_decoded, container_decoded, bin_decoded)).fetchall()
    
    # Get stats for this bin
    total_items = len(items)
    total_quantity = sum(item[6] or 0 for item in items)
    
    conn.close()
    
    stats = {
        "total_items": total_items,
        "total_quantity": total_quantity,
        "unique_locations": 0  # No sub-locations for bins
    }
    
    return templates.TemplateResponse("location.html", {
        "request": request,
        "title": f"Bin: {bin_decoded}",
        "area": area_decoded,
        "container": container_decoded,
        "bin": bin_decoded,
        "items": items,
        "sub_locations": [],  # No sub-locations for bins
        "stats": stats
    })
