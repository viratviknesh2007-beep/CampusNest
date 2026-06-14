from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

@router.get("/blocks", response_model=List[schemas.HostelBlockResponse])
def get_blocks(db: Session = Depends(get_db)):
    return db.query(models.HostelBlock).all()

@router.get("/map")
def get_hostel_map(db: Session = Depends(get_db)):
    blocks = db.query(models.HostelBlock).all()
    result = []
    
    for block in blocks:
        rooms = db.query(models.Room).filter(models.Room.block_id == block.id).all()
        rooms_data = []
        for room in rooms:
            # Get occupants
            allocs = db.query(models.RoomAllocation).filter(
                models.RoomAllocation.room_id == room.id,
                models.RoomAllocation.is_active == True
            ).all()
            occupants = []
            for alloc in allocs:
                student = db.query(models.Student).filter(models.Student.id == alloc.student_id).first()
                user = db.query(models.User).filter(models.User.id == student.user_id).first()
                
                # Fetch active complaints for this student
                active_comps = db.query(models.Complaint).filter(
                    models.Complaint.student_id == student.id,
                    models.Complaint.status != "Resolved"
                ).all()
                comp_data = []
                for comp in active_comps:
                    comp_data.append({
                        "id": comp.id,
                        "category": comp.category,
                        "title": comp.title,
                        "description": comp.description,
                        "status": comp.status
                    })
                
                occupants.append({
                    "student_id": student.id,
                    "roll_number": student.roll_number,
                    "full_name": user.full_name,
                    "department": student.department,
                    "year": student.year,
                    "complaints": comp_data
                })
            
            # Count active complaints in this room
            room_complaints = sum(len(o["complaints"]) for o in occupants)

            rooms_data.append({
                "id": room.id,
                "room_number": room.room_number,
                "floor": room.floor,
                "capacity": room.capacity,
                "status": room.status,
                "rent": room.rent,
                "occupants": occupants,
                "complaints_count": room_complaints
            })
            
        result.append({
            "block_id": block.id,
            "block_name": block.name,
            "total_floors": block.total_floors,
            "gender_type": block.gender_type,
            "rooms": rooms_data
        })
    return result

@router.get("/occupancy-stats")
def get_occupancy_stats(db: Session = Depends(get_db)):
    total_rooms = db.query(models.Room).count()
    occupied_rooms = db.query(models.Room).filter(models.Room.status == "Occupied").count()
    maintenance_rooms = db.query(models.Room).filter(models.Room.status == "Maintenance").count()
    available_rooms = db.query(models.Room).filter(models.Room.status == "Available").count()
    
    total_students = db.query(models.Student).count()
    allocated_students = db.query(models.RoomAllocation).filter(models.RoomAllocation.is_active == True).count()
    
    # Calculate percentage
    occupancy_rate = round((allocated_students / (total_rooms * 2)) * 100, 1) if total_rooms > 0 else 0

    return {
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "maintenance_rooms": maintenance_rooms,
        "available_rooms": available_rooms,
        "total_students": total_students,
        "allocated_students": allocated_students,
        "occupancy_rate": occupancy_rate
    }

@router.post("/allocate")
def allocate_room(allocation: schemas.RoomAllocationBase, db: Session = Depends(get_db), current_user: models.User = Depends(auth.RoleChecker(["admin", "warden"]))):
    # Check student
    student = db.query(models.Student).filter(models.Student.id == allocation.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Check room
    room = db.query(models.Room).filter(models.Room.id == allocation.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    if room.status == "Maintenance":
        raise HTTPException(status_code=400, detail="Room is currently under maintenance")

    # Check capacity limit
    active_allocations_count = db.query(models.RoomAllocation).filter(
        models.RoomAllocation.room_id == room.id,
        models.RoomAllocation.is_active == True
    ).count()
    if active_allocations_count >= room.capacity:
        raise HTTPException(status_code=400, detail="Room capacity has been reached")

    # Deactivate existing allocations for this student
    db.query(models.RoomAllocation).filter(
        models.RoomAllocation.student_id == student.id,
        models.RoomAllocation.is_active == True
    ).update({"is_active": False})

    # Create new allocation
    new_alloc = models.RoomAllocation(
        student_id=student.id,
        room_id=room.id,
        is_active=True
    )
    db.add(new_alloc)
    
    # Update room status
    if active_allocations_count + 1 >= room.capacity:
        room.status = "Occupied"
    else:
        room.status = "Available"

    # Notify student
    notif = models.Notification(
        user_id=student.user_id,
        title="Room Allocated! 🔑",
        message=f"You have been allocated Room {room.room_number} (Floor {room.floor}) in Block {room.block.name}."
    )
    db.add(notif)
    db.commit()
    
    return {"message": "Room allocated successfully"}

@router.post("/deallocate/{student_id}")
def deallocate_room(student_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.RoleChecker(["admin", "warden"]))):
    alloc = db.query(models.RoomAllocation).filter(
        models.RoomAllocation.student_id == student_id,
        models.RoomAllocation.is_active == True
    ).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Active allocation not found for this student")
        
    alloc.is_active = False
    
    # Update room status
    room = db.query(models.Room).filter(models.Room.id == alloc.room_id).first()
    if room:
        active_count = db.query(models.RoomAllocation).filter(
            models.RoomAllocation.room_id == room.id,
            models.RoomAllocation.is_active == True
        ).count()
        if active_count == 0:
            room.status = "Available"
        else:
            room.status = "Available" # Since it has space now

    # Notify student
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student:
        notif = models.Notification(
            user_id=student.user_id,
            title="Room Deallocated 🚪",
            message="Your room allocation has been removed by the administration."
        )
        db.add(notif)
        
    db.commit()
    return {"message": "Room deallocated successfully"}

@router.post("/preferences")
def update_preferences(prefs: schemas.StudentPreferences, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can save preferences")
        
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    student.sleep_schedule = prefs.sleep_schedule
    student.study_preference = prefs.study_preference
    student.cleanliness_level = prefs.cleanliness_level
    db.commit()
    return {"message": "Preferences updated successfully"}

@router.get("/students")
def get_all_students(db: Session = Depends(get_db), current_user: models.User = Depends(auth.RoleChecker(["admin", "warden"]))):
    students = db.query(models.Student).all()
    result = []
    for s in students:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        # Find if allocated
        alloc = db.query(models.RoomAllocation).filter(
            models.RoomAllocation.student_id == s.id,
            models.RoomAllocation.is_active == True
        ).first()
        room_data = None
        if alloc:
            room = db.query(models.Room).filter(models.Room.id == alloc.room_id).first()
            if room:
                room_data = {
                    "id": room.id,
                    "room_number": room.room_number,
                    "block_name": room.block.name
                }
        result.append({
            "id": s.id,
            "roll_number": s.roll_number,
            "full_name": user.full_name if user else "Unknown",
            "email": user.email if user else "",
            "department": s.department,
            "year": s.year,
            "phone": s.phone,
            "gender": s.gender,
            "room": room_data
        })
    return result

