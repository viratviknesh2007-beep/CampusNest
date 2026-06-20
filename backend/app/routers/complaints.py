from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

@router.get("", response_model=List[schemas.ComplaintResponse])
def get_complaints(status_filter: Optional[str] = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Complaint)
    
    if current_user.role == "student":
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student:
            return []
        query = query.filter(models.Complaint.student_id == student.id)
    
    if status_filter:
        query = query.filter(models.Complaint.status == status_filter)
        
    return query.order_by(models.Complaint.created_at.desc()).all()

@router.post("", response_model=schemas.ComplaintResponse)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can submit complaints")
        
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    db_complaint = models.Complaint(
        student_id=student.id,
        category=complaint.category,
        title=complaint.title,
        description=complaint.description,
        block_id=complaint.block_id,
        floor=complaint.floor,
        status="Pending"
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)

    # Notify wardens
    wardens = db.query(models.User).filter(models.User.role == "warden").all()
    for warden in wardens:
        notif = models.Notification(
            user_id=warden.id,
            title="New Complaint Filed ⚠️",
            message=f"Student {current_user.full_name} filed a {complaint.category} complaint: '{complaint.title}'"
        )
        db.add(notif)
    db.commit()

    return db_complaint

@router.put("/{complaint_id}/status", response_model=schemas.ComplaintResponse)
def update_complaint_status(complaint_id: int, status_update: schemas.ComplaintUpdateStatus, db: Session = Depends(get_db), current_user: models.User = Depends(auth.RoleChecker(["warden", "admin"]))):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint.status = status_update.status
    if status_update.status == "Resolved":
        complaint.resolved_at = datetime.utcnow()
        
    # Notify student
    student_user = db.query(models.User).filter(models.User.id == complaint.student.user_id).first()
    if student_user:
        notif = models.Notification(
            user_id=student_user.id,
            title="Complaint Update 🔧",
            message=f"Your complaint '{complaint.title}' status was updated to: {status_update.status}"
        )
        db.add(notif)
        
    db.commit()
    db.refresh(complaint)
    return complaint

@router.post("/sos")
def trigger_sos(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    room_number = "Unknown"
    block_name = "Unknown"
    
    if student:
        alloc = db.query(models.RoomAllocation).filter(
            models.RoomAllocation.student_id == student.id,
            models.RoomAllocation.is_active == True
        ).first()
        if alloc:
            room = db.query(models.Room).filter(models.Room.id == alloc.room_id).first()
            if room:
                room_number = room.room_number
                block_name = room.block.name

    # Create high priority notifications for all Wardens and Administrators
    emergency_msg = f"EMERGENCY SOS: Student {current_user.full_name} in Block {block_name}, Room {room_number} triggered the SOS button! Please respond immediately. Phone: {student.phone if student else 'N/A'}"
    
    responders = db.query(models.User).filter(models.User.role.in_(["warden", "admin"])).all()
    for resp in responders:
        notif = models.Notification(
            user_id=resp.id,
            title="🚨 EMERGENCY SOS ALERT! 🚨",
            message=emergency_msg
        )
        db.add(notif)
        
    # Also log as a critical complaint
    if student:
        sos_complaint = models.Complaint(
            student_id=student.id,
            category="Other",
            title="🚨 EMERGENCY SOS TRIGGERED",
            description=f"SOS clicked at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}. Contact: {student.phone}",
            block_id=alloc.room.block_id if (student and alloc) else 1,
            floor=alloc.room.floor if (student and alloc) else 1,
            status="Pending"
        )
        db.add(sos_complaint)

    db.commit()
    return {"status": "success", "message": "Emergency alerts dispatched successfully to all security and warden personnel."}

@router.get("/analytics/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    # Group complaints by block
    blocks = db.query(models.HostelBlock).all()
    heatmap_data = []
    
    for block in blocks:
        total_block_complaints = db.query(models.Complaint).filter(models.Complaint.block_id == block.id).count()
        # Group by floors
        floor_data = {}
        for f in range(1, block.total_floors + 1):
            floor_data[f] = db.query(models.Complaint).filter(
                models.Complaint.block_id == block.id,
                models.Complaint.floor == f
            ).count()
            
        # Group by categories
        category_counts = {}
        for cat in ["Electrical", "Plumbing", "Internet", "Cleaning", "Furniture", "Other"]:
            category_counts[cat] = db.query(models.Complaint).filter(
                models.Complaint.block_id == block.id,
                models.Complaint.category == cat
            ).count()

        heatmap_data.append({
            "block_id": block.id,
            "block_name": block.name,
            "total_complaints": total_block_complaints,
            "floors": floor_data,
            "categories": category_counts
        })
        
    return heatmap_data

@router.get("/housekeeping", response_model=List[schemas.HousekeepingContactResponse])
def get_housekeeping_contacts(db: Session = Depends(get_db)):
    return db.query(models.HousekeepingContact).all()

@router.put("/housekeeping/{contact_id}", response_model=schemas.HousekeepingContactResponse)
def update_housekeeping_contact(contact_id: int, contact_update: schemas.HousekeepingContactUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.RoleChecker(["warden", "admin"]))):
    contact = db.query(models.HousekeepingContact).filter(models.HousekeepingContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Housekeeping contact not found")
    contact.contact_number = contact_update.contact_number
    db.commit()
    db.refresh(contact)
    return contact
