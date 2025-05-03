from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import sqlite3
import os

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
        # Prepare the search query - wrap each term in quotes to handle special characters
        search_terms = q.split()
        # Prepend each term with the * wildcard and wrap in quotes for phrase matching
        quoted_terms = [f'"{term}"' for term in search_terms]
        # Join all terms with OR operator for any-term matching
        search_query = " OR ".join(quoted_terms)
        
        try:
            # Perform the search query with the properly formatted search string
            results = conn.execute("""
                SELECT i.* FROM items i
                WHERE i.id IN (
                    SELECT rowid FROM item_fts
                    WHERE item_fts MATCH ?
                )
            """, (search_query,)).fetchall()
            
            # For each result, determine which fields matched
            for item in results:
                item_id = item[0]
                matched_fields = []
                
                # Check each field for matches
                fields = ["name", "description", "area", "container", "bin"]
                for field in fields:
                    try:
                        match_count = conn.execute(f"""
                            SELECT COUNT(*) FROM item_fts
                            WHERE rowid = ? AND {field} MATCH ?
                        """, (item_id, search_query)).fetchone()[0]
                        
                        if match_count > 0:
                            matched_fields.append(field)
                    except sqlite3.Error:
                        # Skip if there's an error in this field
                        continue
                
                match_info[item_id] = matched_fields
        except sqlite3.Error as e:
            # If there's an error with the FTS query, fall back to a simpler LIKE query
            print(f"FTS search error: {e}")
            like_pattern = f"%{q}%"
            results = conn.execute("""
                SELECT * FROM items
                WHERE name LIKE ? OR description LIKE ? OR area LIKE ? OR container LIKE ? OR bin LIKE ?
            """, (like_pattern, like_pattern, like_pattern, like_pattern, like_pattern)).fetchall()
            
            # For LIKE queries, determine which fields matched
            for item in results:
                item_id = item[0]
                matched_fields = []
                
                # Check each field for the search term
                if q.lower() in item[1].lower():  # name
                    matched_fields.append("name")
                if item[2] and q.lower() in item[2].lower():  # description
                    matched_fields.append("description")
                if item[3] and q.lower() in item[3].lower():  # area
                    matched_fields.append("area")
                if item[4] and q.lower() in item[4].lower():  # container
                    matched_fields.append("container")
                if item[5] and q.lower() in item[5].lower():  # bin
                    matched_fields.append("bin")
                
                match_info[item_id] = matched_fields
    
    conn.close()
    return templates.TemplateResponse("search.html", {
        "request": request, 
        "results": results, 
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
