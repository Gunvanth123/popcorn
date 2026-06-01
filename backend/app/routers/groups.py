from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.db import get_db
from app.models.models import User, CustomGroup
from app.schemas import schemas
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/groups", tags=["Custom Groups"])

@router.get("/", response_model=List[schemas.CustomGroupOut])
def get_groups(
    type: Optional[str] = Query(None, description="Filter groups by type ('popcorn' or 'gamecorn')"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CustomGroup).filter(CustomGroup.user_id == current_user.id)
    if type:
        query = query.filter(CustomGroup.type == type)
    return query.order_by(CustomGroup.created_at.desc()).all()

@router.post("/", response_model=schemas.CustomGroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    group: schemas.CustomGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_group = CustomGroup(
        user_id=current_user.id,
        name=group.name,
        type=group.type
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.put("/{group_id}", response_model=schemas.CustomGroupOut)
def update_group(
    group_id: int,
    group_data: schemas.CustomGroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_group = db.query(CustomGroup).filter(
        CustomGroup.id == group_id,
        CustomGroup.user_id == current_user.id
    ).first()
    
    if not db_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    if group_data.name:
        db_group.name = group_data.name
        
    db.commit()
    db.refresh(db_group)
    return db_group

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_group = db.query(CustomGroup).filter(
        CustomGroup.id == group_id,
        CustomGroup.user_id == current_user.id
    ).first()
    
    if not db_group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        
    db.delete(db_group)
    db.commit()
    return None
