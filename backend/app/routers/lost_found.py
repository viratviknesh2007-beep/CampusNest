from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/lost-found", tags=["lost-found"])

@router.get("", response_model=List[schemas.LostFoundResponse])
def get_items(db: Session = Depends(get_db)):
    return db.query(models.LostFound).order_by(models.LostFound.created_at.desc()).all()

@router.post("", response_model=schemas.LostFoundResponse)
def create_item(item: schemas.LostFoundCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_item = models.LostFound(
        reporter_id=current_user.id,
        item_type=item.item_type,
        title=item.title,
        description=item.description,
        category=item.category,
        contact_info=item.contact_info,
        image_url=item.image_url,
        is_resolved=False
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/matches")
def get_matches(db: Session = Depends(get_db)):
    lost_items = db.query(models.LostFound).filter(models.LostFound.item_type == "Lost", models.LostFound.is_resolved == False).all()
    found_items = db.query(models.LostFound).filter(models.LostFound.item_type == "Found", models.LostFound.is_resolved == False).all()
    
    matches = []
    for lost in lost_items:
        for found in found_items:
            # Basic matching rule: category matches and title overlaps
            category_match = lost.category.lower() == found.category.lower()
            title_words_lost = set(lost.title.lower().split())
            title_words_found = set(found.title.lower().split())
            overlap = title_words_lost.intersection(title_words_found)
            
            if category_match and len(overlap) > 0:
                matches.append({
                    "lost_item": {
                        "id": lost.id,
                        "title": lost.title,
                        "description": lost.description,
                        "contact_info": lost.contact_info
                    },
                    "found_item": {
                        "id": found.id,
                        "title": found.title,
                        "description": found.description,
                        "contact_info": found.contact_info
                    },
                    "match_reason": f"Matches category '{lost.category}' with keyword overlaps: {', '.join(overlap)}"
                })
    return matches

@router.put("/{item_id}/resolve")
def resolve_item(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    item = db.query(models.LostFound).filter(models.LostFound.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.reporter_id != current_user.id and current_user.role not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to resolve this post")
        
    item.is_resolved = True
    db.commit()
    return {"message": "Item marked as resolved"}
