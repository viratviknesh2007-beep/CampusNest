import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/gate-pass", tags=["gate-pass"])

@router.get("", response_model=List[schemas.GatePassResponse])
def get_gate_passes(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "student":
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if not student:
            return []
        return db.query(models.GatePass).filter(models.GatePass.student_id == student.id).order_by(models.GatePass.created_at.desc()).all()
    else:
        return db.query(models.GatePass).order_by(models.GatePass.created_at.desc()).all()

@router.post("", response_model=schemas.GatePassResponse)
def create_gate_pass(gate_pass: schemas.GatePassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can generate gate passes")
        
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Generate QR Code payload string
    qr_payload = {
        "student_name": current_user.full_name,
        "roll_number": student.roll_number,
        "purpose": gate_pass.purpose,
        "exit_time": gate_pass.exit_time.strftime("%Y-%m-%d %H:%M"),
        "entry_time": gate_pass.entry_time.strftime("%Y-%m-%d %H:%M"),
        "timestamp": gate_pass.exit_time.isoformat()
    }
    
    db_pass = models.GatePass(
        student_id=student.id,
        purpose=gate_pass.purpose,
        exit_time=gate_pass.exit_time,
        entry_time=gate_pass.entry_time,
        qr_code_data=json.dumps(qr_payload),
        status="Generated"
    )
    db.add(db_pass)
    db.commit()
    db.refresh(db_pass)

    return db_pass

@router.put("/{pass_id}/status")
def update_gate_pass_status(pass_id: int, status_update: schemas.ComplaintUpdateStatus, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Security/wardens can update gate pass status
    db_pass = db.query(models.GatePass).filter(models.GatePass.id == pass_id).first()
    if not db_pass:
        raise HTTPException(status_code=404, detail="Gate pass not found")
        
    db_pass.status = status_update.status
    db.commit()
    return {"message": f"Gate pass status updated to {status_update.status}"}
