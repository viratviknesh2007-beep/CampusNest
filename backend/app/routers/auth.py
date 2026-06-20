from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
def register_student(student_data: schemas.StudentRegister, db: Session = Depends(get_db)):
    email_lower = student_data.email.strip().lower()
    
    if email_lower.endswith("@campusnest.edu"):
        role = "student"
    elif email_lower.endswith("@campusnestw.edu"):
        role = "warden"
    elif email_lower.endswith("@campusnesta.edu"):
        role = "admin"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email domain. Allowed domains: campusnest.edu (Student), campusnestw.edu (Warden), campusnesta.edu (Admin)."
        )

    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == student_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if role == "student":
        # Check roll number uniqueness
        existing_student = db.query(models.Student).filter(models.Student.roll_number == student_data.roll_number).first()
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number already exists"
            )

    # Create User
    hashed_pwd = auth.get_password_hash(student_data.password)
    db_user = models.User(
        email=student_data.email,
        hashed_password=hashed_pwd,
        full_name=student_data.full_name,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if role == "student":
        # Create Student profile
        db_student = models.Student(
            user_id=db_user.id,
            roll_number=student_data.roll_number,
            gender=student_data.gender,
            department=student_data.department,
            year=student_data.year,
            phone=student_data.phone,
            emergency_contact=student_data.emergency_contact
        )
        db.add(db_student)
        db.commit()
        db.refresh(db_student)

        # Add welcome notification
        welcome_notif = models.Notification(
            user_id=db_user.id,
            title="Welcome to CampusNest! 🏠",
            message=f"Hi {db_user.full_name}, your account is created successfully. You can now explore allocations, leaves, gate passes, and roommate matching."
        )
        db.add(welcome_notif)
        db.commit()

        return {"message": "Student registered successfully", "role": role}
    else:
        return {"message": f"{role.capitalize()} registered successfully", "role": role}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/me")
def get_me(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    user_response = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "created_at": current_user.created_at
    }
    
    if current_user.role == "student":
        student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
        if student:
            user_response["student_profile"] = {
                "id": student.id,
                "roll_number": student.roll_number,
                "gender": student.gender,
                "department": student.department,
                "year": student.year,
                "phone": student.phone,
                "emergency_contact": student.emergency_contact,
                "sleep_schedule": student.sleep_schedule,
                "study_preference": student.study_preference,
                "cleanliness_level": student.cleanliness_level,
                "roommate_matched_id": student.roommate_matched_id
            }
            # Add allocated room details
            alloc = db.query(models.RoomAllocation).filter(
                models.RoomAllocation.student_id == student.id,
                models.RoomAllocation.is_active == True
            ).first()
            if alloc:
                room = db.query(models.Room).filter(models.Room.id == alloc.room_id).first()
                block = db.query(models.HostelBlock).filter(models.HostelBlock.id == room.block_id).first()
                user_response["student_profile"]["room"] = {
                    "room_number": room.room_number,
                    "floor": room.floor,
                    "rent": room.rent,
                    "block_name": block.name if block else "Unknown"
                }
    return user_response

@router.get("/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()

@router.post("/notifications/{notif_id}/read")
def read_notification(notif_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/messages", response_model=schemas.MessageResponse)
def post_message(
    payload: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "warden"]:
        raise HTTPException(status_code=403, detail="Only admins and wardens can post messages")
    
    new_msg = models.Message(
        sender_name=current_user.full_name,
        content=payload.content
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.get("/messages", response_model=List[schemas.MessageResponse])
def get_messages(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(hours=24)
    return db.query(models.Message).filter(models.Message.created_at >= cutoff).order_by(models.Message.created_at.desc()).all()
