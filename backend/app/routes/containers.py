from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..schemas import AreaDetail, ContainerDetail, BinDetail
from ..database import database
from ..auth.oauth import get_current_user

router = APIRouter()

# Areas
@router.get("/areas", response_model=List[str])
async def get_areas(
    current_user: str = Depends(get_current_user)
):
    query = """
        SELECT DISTINCT area
        FROM items
        WHERE area IS NOT NULL
        ORDER BY area
    """
    
    results = await database.fetch_all(query=query)
    return [result["area"] for result in results if result["area"]]

@router.get("/areas/{area}", response_model=AreaDetail)
async def get_area_detail(
    area: str,
    current_user: str = Depends(get_current_user)
):
    # Check if area exists
    exists_query = "SELECT COUNT(*) FROM items WHERE area = :area"
    count = await database.fetch_val(query=exists_query, values={"area": area})
    
    if count == 0:
        raise HTTPException(status_code=404, detail="Area not found")
    
    # Get summary information
    summary_query = """
        SELECT 
            COUNT(id) as item_count,
            SUM(quantity) as total_quantity
        FROM items
        WHERE area = :area
    """
    
    summary = await database.fetch_one(query=summary_query, values={"area": area})
    
    # Get containers in this area
    containers_query = """
        SELECT 
            container,
            COUNT(id) as item_count,
            SUM(quantity) as total_quantity
        FROM items
        WHERE area = :area AND container IS NOT NULL
        GROUP BY container
        ORDER BY container
        LIMIT 6
    """
    
    containers_result = await database.fetch_all(query=containers_query, values={"area": area})
    containers = [
        {
            "name": container["container"],
            "item_count": container["item_count"],
            "total_quantity": container["total_quantity"]
        }
        for container in containers_result
        if container["container"]
    ]
    
    # Get items in this area
    items_query = """
        SELECT i.*, GROUP_CONCAT(it.tag) as tags
        FROM items i
        LEFT JOIN items_tags it ON i.id = it.item_id
        WHERE i.area = :area
        GROUP BY i.id
    """
    
    items_result = await database.fetch_all(query=items_query, values={"area": area})
    
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
            tags = [{"id": -1, "item_id": item_dict['id'], "tag": tag} for tag in tag_list]
        
        item_dict['tags'] = tags
        items.append(item_dict)
    
    return {
        "name": area,
        "item_count": summary["item_count"] or 0,
        "total_quantity": summary["total_quantity"] or 0,
        "containers": containers,
        "items": items
    }

# Containers
@router.get("/containers", response_model=List[dict])
async def get_containers(
    area: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    if area:
        query = """
            SELECT DISTINCT container
            FROM items
            WHERE area = :area AND container IS NOT NULL
            ORDER BY container
        """
        values = {"area": area}
    else:
        query = """
            SELECT DISTINCT container
            FROM items
            WHERE container IS NOT NULL
            ORDER BY container
        """
        values = {}
    
    results = await database.fetch_all(query=query, values=values)
    return [{"name": result["container"], "area": area} for result in results if result["container"]]

@router.get("/containers/{container}", response_model=ContainerDetail)
async def get_container_detail(
    container: str,
    area: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    # Build query based on whether area is provided
    if area:
        exists_query = "SELECT COUNT(*) FROM items WHERE area = :area AND container = :container"
        values = {"area": area, "container": container}
    else:
        exists_query = "SELECT COUNT(*) FROM items WHERE container = :container"
        values = {"container": container}
    
    # Check if container exists
    count = await database.fetch_val(query=exists_query, values=values)
    
    if count == 0:
        raise HTTPException(status_code=404, detail="Container not found")
    
    # Get the area if not provided
    if not area:
        area_query = "SELECT DISTINCT area FROM items WHERE container = :container LIMIT 1"
        area_result = await database.fetch_one(query=area_query, values={"container": container})
        area = area_result["area"] if area_result and area_result["area"] else "Unknown"
    
    # Get summary information
    if area != "Unknown":
        summary_query = """
            SELECT 
                COUNT(id) as item_count,
                SUM(quantity) as total_quantity
            FROM items
            WHERE area = :area AND container = :container
        """
        values = {"area": area, "container": container}
    else:
        summary_query = """
            SELECT 
                COUNT(id) as item_count,
                SUM(quantity) as total_quantity
            FROM items
            WHERE container = :container
        """
        values = {"container": container}
    
    summary = await database.fetch_one(query=summary_query, values=values)
    
    # Get bins in this container
    if area != "Unknown":
        bins_query = """
            SELECT DISTINCT bin
            FROM items
            WHERE area = :area AND container = :container AND bin IS NOT NULL
            ORDER BY bin
            LIMIT 6
        """
        values = {"area": area, "container": container}
    else:
        bins_query = """
            SELECT DISTINCT bin
            FROM items
            WHERE container = :container AND bin IS NOT NULL
            ORDER BY bin
            LIMIT 6
        """
        values = {"container": container}
    
    bins_result = await database.fetch_all(query=bins_query, values=values)
    bins = [bin["bin"] for bin in bins_result if bin["bin"]]
    
    # Get items in this container
    if area != "Unknown":
        items_query = """
            SELECT i.*, GROUP_CONCAT(it.tag) as tags
            FROM items i
            LEFT JOIN items_tags it ON i.id = it.item_id
            WHERE i.area = :area AND i.container = :container
            GROUP BY i.id
        """
        values = {"area": area, "container": container}
    else:
        items_query = """
            SELECT i.*, GROUP_CONCAT(it.tag) as tags
            FROM items i
            LEFT JOIN items_tags it ON i.id = it.item_id
            WHERE i.container = :container
            GROUP BY i.id
        """
        values = {"container": container}
    
    items_result = await database.fetch_all(query=items_query, values=values)
    
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
            tags = [{"id": -1, "item_id": item_dict['id'], "tag": tag} for tag in tag_list]
        
        item_dict['tags'] = tags
        items.append(item_dict)
    
    return {
        "name": container,
        "area": area,
        "item_count": summary["item_count"] or 0,
        "total_quantity": summary["total_quantity"] or 0,
        "bins": bins,
        "items": items
    }

# Bins
@router.get("/bins", response_model=List[dict])
async def get_bins(
    area: Optional[str] = None,
    container: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    query_parts = ["SELECT DISTINCT bin, area, container FROM items WHERE bin IS NOT NULL"]
    values = {}
    
    if area:
        query_parts.append("AND area = :area")
        values["area"] = area
    
    if container:
        query_parts.append("AND container = :container")
        values["container"] = container
    
    query_parts.append("ORDER BY bin")
    query = " ".join(query_parts)
    
    results = await database.fetch_all(query=query, values=values)
    return [
        {
            "name": result["bin"], 
            "area": result["area"] or "Unknown", 
            "container": result["container"] or "Unknown"
        } 
        for result in results 
        if result["bin"]
    ]

@router.get("/bins/{bin}", response_model=BinDetail)
async def get_bin_detail(
    bin: str,
    area: Optional[str] = None,
    container: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    # Build query based on parameters provided
    query_parts = ["SELECT COUNT(*) FROM items WHERE bin = :bin"]
    values = {"bin": bin}
    
    if area:
        query_parts.append("AND area = :area")
        values["area"] = area
    
    if container:
        query_parts.append("AND container = :container")
        values["container"] = container
    
    exists_query = " ".join(query_parts)
    
    # Check if bin exists
    count = await database.fetch_val(query=exists_query, values=values)
    
    if count == 0:
        raise HTTPException(status_code=404, detail="Bin not found")
    
    # Get area and container if not provided
    if not area or not container:
        location_query = """
            SELECT DISTINCT area, container
            FROM items
            WHERE bin = :bin
            LIMIT 1
        """
        location = await database.fetch_one(query=location_query, values={"bin": bin})
        
        area = area or (location["area"] if location and location["area"] else "Unknown")
        container = container or (location["container"] if location and location["container"] else "Unknown")
    
    # Get summary information
    summary_parts = [
        "SELECT COUNT(id) as item_count, SUM(quantity) as total_quantity",
        "FROM items",
        "WHERE bin = :bin"
    ]
    values = {"bin": bin}
    
    if area != "Unknown":
        summary_parts.append("AND area = :area")
        values["area"] = area
    
    if container != "Unknown":
        summary_parts.append("AND container = :container")
        values["container"] = container
    
    summary_query = " ".join(summary_parts)
    summary = await database.fetch_one(query=summary_query, values=values)
    
    # Get items in this bin
    items_parts = [
        "SELECT i.*, GROUP_CONCAT(it.tag) as tags",
        "FROM items i",
        "LEFT JOIN items_tags it ON i.id = it.item_id",
        "WHERE i.bin = :bin"
    ]
    values = {"bin": bin}
    
    if area != "Unknown":
        items_parts.append("AND i.area = :area")
        values["area"] = area
    
    if container != "Unknown":
        items_parts.append("AND i.container = :container")
        values["container"] = container
    
    items_parts.append("GROUP BY i.id")
    items_query = " ".join(items_parts)
    
    items_result = await database.fetch_all(query=items_query, values=values)
    
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
            tags = [{"id": -1, "item_id": item_dict['id'], "tag": tag} for tag in tag_list]
        
        item_dict['tags'] = tags
        items.append(item_dict)
    
    return {
        "name": bin,
        "area": area,
        "container": container,
        "item_count": summary["item_count"] or 0,
        "total_quantity": summary["total_quantity"] or 0,
        "items": items
    }
