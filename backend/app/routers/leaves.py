from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/leaves", tags=["leaves"])

@router.get("", response_model=List[schemas.LeaveRequestResponse])
def get_leaves(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "student":
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student:
            return []
        return db.query(models.LeaveRequest).filter(models.LeaveRequest.student_id == student.id).order_by(models.LeaveRequest.created_at.desc()).all()
    else:
        return db.query(models.LeaveRequest).order_by(models.LeaveRequest.created_at.desc()).all()

@router.post("", response_model=schemas.LeaveRequestResponse)
def apply_leave(leave: schemas.LeaveRequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can apply for leaves")
        
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Delete old leave requests and old gate passes to keep only the newest one
    db.query(models.LeaveRequest).filter(models.LeaveRequest.student_id == student.id).delete()
    db.query(models.GatePass).filter(models.GatePass.student_id == student.id).delete()
    db.commit()

    db_leave = models.LeaveRequest(
        student_id=student.id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status="Pending"
    )
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)

    # Notify wardens
    wardens = db.query(models.User).filter(models.User.role == "warden").all()
    for warden in wardens:
        notif = models.Notification(
            user_id=warden.id,
            title="New Leave Application 📝",
            message=f"Student {current_user.full_name} applied for leave from {leave.start_date.strftime('%Y-%m-%d')} to {leave.end_date.strftime('%Y-%m-%d')}"
        )
        db.add(notif)
    db.commit()

    return db_leave

@router.put("/{leave_id}/review", response_model=schemas.LeaveRequestResponse)
def review_leave(leave_id: int, review: schemas.LeaveRequestUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.RoleChecker(["warden", "admin"]))):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    old_status = leave.status
    leave.status = review.status
    leave.warden_remarks = review.warden_remarks
    
    # Auto-generate gate pass if approved
    if old_status != "Approved" and review.status == "Approved":
        db_pass = models.GatePass(
            student_id=leave.student_id,
            purpose=f"Approved Leave: {leave.reason}",
            exit_time=leave.start_date,
            entry_time=leave.end_date,
            qr_code_data="APPROVED",
            status="Approved"
        )
        db.add(db_pass)
    
    # Notify student
    student_user = db.query(models.User).filter(models.User.id == leave.student.user_id).first()
    if student_user:
        status_emoji = "✅" if review.status == "Approved" else "❌"
        notif = models.Notification(
            user_id=student_user.id,
            title=f"Leave Request {review.status} {status_emoji}",
            message=f"Your leave request has been {review.status.lower()}. Remarks: {review.warden_remarks or 'None'}"
        )
        db.add(notif)
        
    db.commit()
    db.refresh(leave)
    return leave
