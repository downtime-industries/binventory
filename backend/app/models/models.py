from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    area = Column(String, nullable=True)
    container = Column(String, nullable=True)
    bin = Column(String, nullable=True)
    quantity = Column(Integer, default=1)
    cost = Column(Float, default=0.0)
    url = Column(String, nullable=True)
    
    # Relationship with tags
    tags = relationship("ItemTag", back_populates="item", cascade="all, delete-orphan")


class ItemTag(Base):
    __tablename__ = "items_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"))
    tag = Column(String, nullable=False)
    
    # Relationship with items
    item = relationship("Item", back_populates="tags")
