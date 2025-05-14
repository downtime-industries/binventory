import databases
import sqlalchemy
from sqlalchemy import create_engine, text

DATABASE_URL = "sqlite:///./binventory.db"
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# Create engine
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

async def create_db_and_tables():
    # Create tables if they don't exist
    with engine.begin() as conn:
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            area TEXT,
            container TEXT,
            bin TEXT,
            quantity INTEGER DEFAULT 1,
            cost REAL DEFAULT 0.0,
            url TEXT
        )
        """))
        
        conn.execute(text("""
        CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5 (
            name, 
            description,
            area,
            container, 
            bin,
            content='items', 
            content_rowid='id',
            tokenize='porter'
        )
        """))
        
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS items_tags (
            id INTEGER PRIMARY KEY,
            item_id INTEGER NOT NULL,
            tag TEXT NOT NULL,
            FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
        )
        """))
        
        conn.execute(text("""
        CREATE VIRTUAL TABLE IF NOT EXISTS items_tags_fts USING fts5 (
            tag,
            content='items_tags',
            content_rowid='id',
            tokenize='porter'
        )
        """))
        
        # Create triggers for FTS tables
        # For items FTS
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
            INSERT INTO items_fts(rowid, name, description, area, container, bin) 
            VALUES (new.id, new.name, new.description, new.area, new.container, new.bin);
        END;
        """))
        
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
            INSERT INTO items_fts(items_fts, rowid, name, description, area, container, bin) 
            VALUES('delete', old.id, old.name, old.description, old.area, old.container, old.bin);
        END;
        """))
        
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
            INSERT INTO items_fts(items_fts, rowid, name, description, area, container, bin) 
            VALUES('delete', old.id, old.name, old.description, old.area, old.container, old.bin);
            INSERT INTO items_fts(rowid, name, description, area, container, bin) 
            VALUES (new.id, new.name, new.description, new.area, new.container, new.bin);
        END;
        """))
        
        # For items_tags FTS
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_tags_ai AFTER INSERT ON items_tags BEGIN
            INSERT INTO items_tags_fts(rowid, tag) VALUES (new.id, new.tag);
        END;
        """))
        
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_tags_ad AFTER DELETE ON items_tags BEGIN
            INSERT INTO items_tags_fts(items_tags_fts, rowid, tag) VALUES('delete', old.id, old.tag);
        END;
        """))
        
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_tags_au AFTER UPDATE ON items_tags BEGIN
            INSERT INTO items_tags_fts(items_tags_fts, rowid, tag) VALUES('delete', old.id, old.tag);
            INSERT INTO items_tags_fts(rowid, tag) VALUES (new.id, new.tag);
        END;
        """))
