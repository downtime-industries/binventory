from pydantic import BaseModel
from typing import List, Optional

class TagBase(BaseModel):
    tag: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    item_id: int
    
    class Config:
        orm_mode = True

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    area: Optional[str] = None
    container: Optional[str] = None
    bin: Optional[str] = None
    quantity: int = 1
    cost: float = 0.0
    url: Optional[str] = None

class ItemCreate(ItemBase):
    tags: Optional[List[str]] = []

class Item(ItemBase):
    id: int
    tags: List[Tag] = []
    
    class Config:
        orm_mode = True

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    area: Optional[str] = None
    container: Optional[str] = None
    bin: Optional[str] = None
    quantity: Optional[int] = None
    cost: Optional[float] = None
    url: Optional[str] = None
    tags: Optional[List[str]] = None

class SearchResult(BaseModel):
    items: List[Item]
    total: int

class ContainerInfo(BaseModel):
    name: str
    item_count: int
    total_quantity: int
    
class AreaDetail(BaseModel):
    name: str
    item_count: int
    total_quantity: int
    containers: List[ContainerInfo] = []
    items: List[Item] = []

class ContainerDetail(BaseModel):
    name: str
    area: str
    item_count: int
    total_quantity: int
    bins: List[str] = []
    items: List[Item] = []

class BinDetail(BaseModel):
    name: str
    area: str
    container: str
    item_count: int
    total_quantity: int
    items: List[Item] = []

class TagDetail(BaseModel):
    name: str
    item_count: int
    total_quantity: int
    areas: List[str] = []
    containers: List[str] = []
    bins: List[str] = []
    items: List[Item] = []

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
