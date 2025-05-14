from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text, select, func
from typing import List, Optional
from ..schemas import Item, ItemCreate, ItemUpdate, SearchResult
from ..database import database
from ..auth.oauth import get_current_user

router = APIRouter()

@router.get("/items", response_model=SearchResult)
async def get_items(
    search: Optional[str] = None,
    area: Optional[str] = None,
    container: Optional[str] = None,
    bin: Optional[str] = None,
    tag: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
):
    # Build the query based on filters
    if search:
        # Use FTS for search
        query = """
            SELECT i.*, GROUP_CONCAT(it.tag) as tags
            FROM items i
            LEFT JOIN items_tags it ON i.id = it.item_id
            WHERE i.id IN (
                SELECT rowid FROM items_fts 
                WHERE items_fts MATCH :search
            )
        """
        params = {"search": search}
    else:
        query = """
            SELECT i.*, GROUP_CONCAT(it.tag) as tags
            FROM items i
            LEFT JOIN items_tags it ON i.id = it.item_id
            WHERE 1=1
        """
        params = {}
    
    # Apply filters
    if area:
        query += " AND i.area = :area"
        params["area"] = area
    
    if container:
        query += " AND i.container = :container"
        params["container"] = container
    
    if bin:
        query += " AND i.bin = :bin"
        params["bin"] = bin
    
    if tag:
        query += " AND i.id IN (SELECT item_id FROM items_tags WHERE tag = :tag)"
        params["tag"] = tag
    
    # Add grouping
    query += " GROUP BY i.id"
    
    # Get total count
    count_query = f"SELECT COUNT(*) FROM ({query}) as count_query"
    total = await database.fetch_val(query=count_query, values=params)
    
    # Add pagination
    query += " LIMIT :limit OFFSET :skip"
    params["limit"] = limit
    params["skip"] = skip
    
    # Execute the query
    result = await database.fetch_all(query=query, values=params)
    
    # Process the results to include tags
    items = []
    for row in result:
        # Convert row to dict using dict() instead of items()
        item_dict = dict(row)
        # Remove tags from the dict as we'll process it separately
        tags_str = item_dict.pop('tags', None)
        
        tags = []
        if tags_str:
            tag_list = tags_str.split(',')
            tags = [{"id": -1, "item_id": item_dict['id'], "tag": tag} for tag in tag_list]
        
        item_dict['tags'] = tags
        items.append(item_dict)
    
    return {"items": items, "total": total}

@router.post("/items", response_model=Item)
async def create_item(
    item: ItemCreate,
    current_user: str = Depends(get_current_user)
):
    # Insert the item
    query = """
        INSERT INTO items (name, description, area, container, bin, quantity, cost, url)
        VALUES (:name, :description, :area, :container, :bin, :quantity, :cost, :url)
        RETURNING id
    """
    values = {
        "name": item.name,
        "description": item.description,
        "area": item.area,
        "container": item.container,
        "bin": item.bin,
        "quantity": item.quantity,
        "cost": item.cost,
        "url": item.url
    }
    
    item_id = await database.execute(query=query, values=values)
    
    # Insert tags if any
    if item.tags:
        tag_values = []
        for tag in item.tags:
            tag_values.append({
                "item_id": item_id,
                "tag": tag
            })
        
        tag_query = """
            INSERT INTO items_tags (item_id, tag)
            VALUES (:item_id, :tag)
        """
        
        await database.execute_many(query=tag_query, values=tag_values)
    
    # Return the created item
    return {**item.dict(), "id": item_id, "tags": [{"id": -1, "item_id": item_id, "tag": tag} for tag in item.tags]}

@router.get("/items/{item_id}", response_model=Item)
async def get_item(
    item_id: int,
    current_user: str = Depends(get_current_user)
):
    query = """
        SELECT i.*, GROUP_CONCAT(it.tag) as tags
        FROM items i
        LEFT JOIN items_tags it ON i.id = it.item_id
        WHERE i.id = :item_id
        GROUP BY i.id
    """
    
    result = await database.fetch_one(query=query, values={"item_id": item_id})
    
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Process the result to include tags
    # Convert row to dict using dict() instead of items()
    item_dict = dict(result)
    # Remove tags from the dict as we'll process it separately
    tags_str = item_dict.pop('tags', None)
    
    tags = []
    if tags_str:
        tag_list = tags_str.split(',')
        tags = [{"id": -1, "item_id": item_id, "tag": tag} for tag in tag_list]
    
    item_dict['tags'] = tags
    
    return item_dict

@router.put("/items/{item_id}", response_model=Item)
async def update_item(
    item_id: int,
    item: ItemUpdate,
    current_user: str = Depends(get_current_user)
):
    # Check if item exists
    exists_query = "SELECT id FROM items WHERE id = :item_id"
    exists = await database.fetch_one(query=exists_query, values={"item_id": item_id})
    
    if not exists:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update the item
    update_fields = []
    values = {"item_id": item_id}
    
    if item.name is not None:
        update_fields.append("name = :name")
        values["name"] = item.name
    
    if item.description is not None:
        update_fields.append("description = :description")
        values["description"] = item.description
    
    if item.area is not None:
        update_fields.append("area = :area")
        values["area"] = item.area
    
    if item.container is not None:
        update_fields.append("container = :container")
        values["container"] = item.container
    
    if item.bin is not None:
        update_fields.append("bin = :bin")
        values["bin"] = item.bin
    
    if item.quantity is not None:
        update_fields.append("quantity = :quantity")
        values["quantity"] = item.quantity
    
    if item.cost is not None:
        update_fields.append("cost = :cost")
        values["cost"] = item.cost
    
    if item.url is not None:
        update_fields.append("url = :url")
        values["url"] = item.url
    
    if update_fields:
        update_query = f"""
            UPDATE items
            SET {", ".join(update_fields)}
            WHERE id = :item_id
        """
        
        await database.execute(query=update_query, values=values)
    
    # Update tags if provided
    if item.tags is not None:
        # Delete existing tags
        delete_tags_query = "DELETE FROM items_tags WHERE item_id = :item_id"
        await database.execute(query=delete_tags_query, values={"item_id": item_id})
        
        # Insert new tags
        if item.tags:
            tag_values = []
            for tag in item.tags:
                tag_values.append({
                    "item_id": item_id,
                    "tag": tag
                })
            
            tag_query = """
                INSERT INTO items_tags (item_id, tag)
                VALUES (:item_id, :tag)
            """
            
            await database.execute_many(query=tag_query, values=tag_values)
    
    # Return the updated item
    return await get_item(item_id, current_user)

@router.delete("/items/{item_id}")
async def delete_item(
    item_id: int,
    current_user: str = Depends(get_current_user)
):
    # Check if item exists
    exists_query = "SELECT id FROM items WHERE id = :item_id"
    exists = await database.fetch_one(query=exists_query, values={"item_id": item_id})
    
    if not exists:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Delete the item (tags will be deleted via cascade)
    query = "DELETE FROM items WHERE id = :item_id"
    await database.execute(query=query, values={"item_id": item_id})
    
    return {"message": "Item deleted successfully"}

@router.get("/search/autocomplete")
async def search_autocomplete(
    q: str,
    limit: int = 10,
    current_user: str = Depends(get_current_user)
):
    # Search for items
    items_query = """
        SELECT DISTINCT name
        FROM items_fts
        WHERE items_fts MATCH :query
        LIMIT :limit
    """
    
    items = await database.fetch_all(
        query=items_query, 
        values={"query": q, "limit": limit}
    )
    
    # Search for areas
    areas_query = """
        SELECT DISTINCT area
        FROM items
        WHERE area LIKE :query
        LIMIT :limit
    """
    
    areas = await database.fetch_all(
        query=areas_query, 
        values={"query": f"%{q}%", "limit": limit}
    )
    
    # Search for containers
    containers_query = """
        SELECT DISTINCT container
        FROM items
        WHERE container LIKE :query
        LIMIT :limit
    """
    
    containers = await database.fetch_all(
        query=containers_query, 
        values={"query": f"%{q}%", "limit": limit}
    )
    
    # Search for bins
    bins_query = """
        SELECT DISTINCT bin
        FROM items
        WHERE bin LIKE :query
        LIMIT :limit
    """
    
    bins = await database.fetch_all(
        query=bins_query, 
        values={"query": f"%{q}%", "limit": limit}
    )
    
    # Search for tags
    tags_query = """
        SELECT DISTINCT tag
        FROM items_tags
        WHERE tag LIKE :query
        LIMIT :limit
    """
    
    tags = await database.fetch_all(
        query=tags_query, 
        values={"query": f"%{q}%", "limit": limit}
    )
    
    return {
        "items": [item["name"] for item in items],
        "areas": [area["area"] for area in areas if area["area"]],
        "containers": [container["container"] for container in containers if container["container"]],
        "bins": [bin["bin"] for bin in bins if bin["bin"]],
        "tags": [tag["tag"] for tag in tags]
    }
