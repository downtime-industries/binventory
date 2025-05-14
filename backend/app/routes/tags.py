from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from typing import List, Optional
from ..schemas import TagDetail
from ..database import database
from ..auth.oauth import get_current_user

router = APIRouter()

@router.get("/tags", response_model=List[str])
async def get_tags(
    current_user: str = Depends(get_current_user)
):
    query = """
        SELECT DISTINCT tag
        FROM items_tags
        ORDER BY tag
    """
    
    results = await database.fetch_all(query=query)
    return [result["tag"] for result in results]

@router.get("/tags/{tag}", response_model=TagDetail)
async def get_tag_detail(
    tag: str,
    current_user: str = Depends(get_current_user)
):
    # Check if tag exists
    exists_query = "SELECT COUNT(*) FROM items_tags WHERE tag = :tag"
    count = await database.fetch_val(query=exists_query, values={"tag": tag})
    
    if count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Get summary information
    summary_query = """
        SELECT 
            COUNT(i.id) as item_count,
            SUM(i.quantity) as total_quantity
        FROM items i
        JOIN items_tags it ON i.id = it.item_id
        WHERE it.tag = :tag
    """
    
    summary = await database.fetch_one(query=summary_query, values={"tag": tag})
    
    # Get areas
    areas_query = """
        SELECT DISTINCT i.area
        FROM items i
        JOIN items_tags it ON i.id = it.item_id
        WHERE it.tag = :tag AND i.area IS NOT NULL
        LIMIT 9
    """
    
    areas_result = await database.fetch_all(query=areas_query, values={"tag": tag})
    areas = [area["area"] for area in areas_result if area["area"]]
    
    # Get containers
    containers_query = """
        SELECT DISTINCT i.container
        FROM items i
        JOIN items_tags it ON i.id = it.item_id
        WHERE it.tag = :tag AND i.container IS NOT NULL
        LIMIT 9
    """
    
    containers_result = await database.fetch_all(query=containers_query, values={"tag": tag})
    containers = [container["container"] for container in containers_result if container["container"]]
    
    # Get bins
    bins_query = """
        SELECT DISTINCT i.bin
        FROM items i
        JOIN items_tags it ON i.id = it.item_id
        WHERE it.tag = :tag AND i.bin IS NOT NULL
        LIMIT 9
    """
    
    bins_result = await database.fetch_all(query=bins_query, values={"tag": tag})
    bins = [bin["bin"] for bin in bins_result if bin["bin"]]
    
    # Get items
    items_query = """
        SELECT i.*, GROUP_CONCAT(it2.tag) as tags
        FROM items i
        JOIN items_tags it ON i.id = it.item_id
        LEFT JOIN items_tags it2 ON i.id = it2.item_id
        WHERE it.tag = :tag
        GROUP BY i.id
    """
    
    items_result = await database.fetch_all(query=items_query, values={"tag": tag})
    
    # Process the items to include tags
    items = []
    for row in items_result:
        # Convert row to dict using dict() instead of items()
        item_dict = dict(row)
        # Remove tags from the dict as we'll process it separately
        tags_str = item_dict.pop('tags', None)
        
        tags = []
        if tags_str:
            tag_list = tags_str.split(',')
            tags = [{"id": -1, "item_id": item_dict['id'], "tag": t} for t in tag_list]
        
        item_dict['tags'] = tags
        items.append(item_dict)
    
    return {
        "name": tag,
        "item_count": summary["item_count"] or 0,
        "total_quantity": summary["total_quantity"] or 0,
        "areas": areas,
        "containers": containers,
        "bins": bins,
        "items": items
    }
