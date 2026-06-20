from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from . import models, auth
from .routers import auth as auth_router, rooms, complaints, leaves, gate_pass, lost_found, ai

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CampusNest API", description="Intelligent Hostel Management Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(rooms.router)
app.include_router(complaints.router)
app.include_router(leaves.router)
app.include_router(gate_pass.router)
app.include_router(lost_found.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CampusNest Intelligent Hostel API"}

# Automatic Database Seeding
def seed_db():
    db = SessionLocal()
    try:
        # Check if users already seeded
        if db.query(models.User).count() > 0:
            return
            
        print("Seeding database with demo data...")
        
        # 1. Create Blocks
        block_a = models.HostelBlock(name="Block A (Boys)", total_floors=3, gender_type="Male")
        block_b = models.HostelBlock(name="Block B (Girls)", total_floors=2, gender_type="Female")
        db.add_all([block_a, block_b])
        db.commit()
        db.refresh(block_a)
        db.refresh(block_b)

        # 2. Create Rooms
        rooms_list = []
        # Block A Rooms
        for floor in [1, 2, 3]:
            for r_num in ["01", "02", "03"]:
                room_no = f"{floor}{r_num}"
                rooms_list.append(models.Room(
                    block_id=block_a.id,
                    room_number=room_no,
                    floor=floor,
                    capacity=2,
                    status="Available",
                    rent=1800.0
                ))
        # Block B Rooms
        for floor in [1, 2]:
            for r_num in ["01", "02", "03"]:
                room_no = f"{floor}{r_num}"
                rooms_list.append(models.Room(
                    block_id=block_b.id,
                    room_number=room_no,
                    floor=floor,
                    capacity=2,
                    status="Available",
                    rent=2000.0
                ))
        db.add_all(rooms_list)
        db.commit()

        # 3. Create Users & Profiles
        # Admins & Wardens
        admin_user = models.User(
            email="admin@campusnesta.edu",
            full_name="Admin Ramesh K",
            role="admin",
            hashed_password=auth.get_password_hash("admin123")
        )
        warden_user = models.User(
            email="warden@campusnestw.edu",
            full_name="Warden Joseph S",
            role="warden",
            hashed_password=auth.get_password_hash("warden123")
        )
        db.add_all([admin_user, warden_user])
        db.commit()

        # Student Users
        students_info = [
            ("student1@campusnest.edu", "Vikram Singh", "CS-2024-001", "Male", "Computer Science", 3, "9876543210", "9876543211", "Early Bird", "Silent", "High"),
            ("student2@campusnest.edu", "Viknesh Kumar", "EC-2025-042", "Male", "Electronics", 2, "8765432109", "8765432108", "Early Bird", "Silent", "High"), # 92% match with Vikram
            ("student3@campusnest.edu", "Priya Sharma", "IT-2026-088", "Female", "Information Tech", 1, "7654321098", "7654321097", "Night Owl", "Group Study", "Medium"),
            ("student4@campusnest.edu", "Ananya Rao", "ME-2023-015", "Female", "Mechanical Eng", 4, "6543210987", "6543210986", "Night Owl", "Silent", "Medium")
        ]

        db_students = []
        for email, name, roll, gender, dept, year, phone, emergency, sleep, study, clean in students_info:
            u = models.User(
                email=email,
                full_name=name,
                role="student",
                hashed_password=auth.get_password_hash("student123")
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            
            s = models.Student(
                user_id=u.id,
                roll_number=roll,
                gender=gender,
                department=dept,
                year=year,
                phone=phone,
                emergency_contact=emergency,
                sleep_schedule=sleep,
                study_preference=study,
                cleanliness_level=clean
            )
            db.add(s)
            db.commit()
            db.refresh(s)
            db_students.append(s)

        # 4. Allocations
        # A-101 (Vikram and Viknesh)
        room_a101 = db.query(models.Room).filter(models.Room.block_id == block_a.id, models.Room.room_number == "101").first()
        room_a102 = db.query(models.Room).filter(models.Room.block_id == block_a.id, models.Room.room_number == "102").first()
        room_b101 = db.query(models.Room).filter(models.Room.block_id == block_b.id, models.Room.room_number == "101").first()
        room_b102 = db.query(models.Room).filter(models.Room.block_id == block_b.id, models.Room.room_number == "102").first()

        db.add_all([
            models.RoomAllocation(student_id=db_students[0].id, room_id=room_a101.id),
            models.RoomAllocation(student_id=db_students[1].id, room_id=room_a101.id),
            models.RoomAllocation(student_id=db_students[2].id, room_id=room_b101.id),
            models.RoomAllocation(student_id=db_students[3].id, room_id=room_b102.id)
        ])
        
        # Set statuses
        room_a101.status = "Occupied"
        room_b101.status = "Available" # Capacity 2, 1 slot filled
        room_b102.status = "Available"
        db.commit()

        # Match Vikram and Viknesh
        db_students[0].roommate_matched_id = db_students[1].id
        db_students[1].roommate_matched_id = db_students[0].id
        db_commit = db.commit()

        # 5. Complaints
        db.add_all([
            models.Complaint(
                student_id=db_students[0].id,
                category="Internet",
                title="WiFi disconnecting frequently",
                description="The WiFi router in Floor 1 corridor disconnects every 15 minutes, affecting classes.",
                block_id=block_a.id,
                floor=1,
                status="Pending"
            ),
            models.Complaint(
                student_id=db_students[2].id,
                category="Electrical",
                title="Squeaking Ceiling Fan",
                description="The fan in B-101 makes high squeaking sounds at speed 3.",
                block_id=block_b.id,
                floor=1,
                status="Resolved",
                resolved_at=datetime.utcnow()
            ),
            models.Complaint(
                student_id=db_students[3].id,
                category="Plumbing",
                title="Tap Leak in washroom",
                description="The washroom flush tap keeps leaking water continuously.",
                block_id=block_b.id,
                floor=1,
                status="In Progress"
            )
        ])
        db.commit()

        # 6. Leave Requests
        db.add_all([
            models.LeaveRequest(
                student_id=db_students[0].id,
                start_date=datetime(2026, 6, 15),
                end_date=datetime(2026, 6, 20),
                reason="Attending family function/festival back home.",
                status="Approved",
                warden_remarks="Approved. Safe travels!"
            ),
            models.LeaveRequest(
                student_id=db_students[2].id,
                start_date=datetime(2026, 6, 22),
                end_date=datetime(2026, 6, 24),
                reason="Routine medical checkup.",
                status="Pending"
            )
        ])
        db.commit()

        # 7. Lost and Found
        db.add_all([
            models.LostFound(
                reporter_id=db_students[0].user_id,
                item_type="Lost",
                title="Lost AirPods Pro Case",
                description="Lost a white AirPods Pro charging case near the hostel mess.",
                category="Electronics",
                contact_info="Call Vikram at 9876543210"
            ),
            models.LostFound(
                reporter_id=db_students[2].user_id,
                item_type="Found",
                title="AirPods Pro Wireless Case",
                description="Found a white charging case on the table in the mess lobby.",
                category="Electronics",
                contact_info="Drop by Priya room B-101"
            )
        ])
        db.commit()

        # 8. Housekeeping Contacts
        if db.query(models.HousekeepingContact).count() == 0:
            print("Seeding housekeeping contacts...")
            for block_type in ["Boys", "Girls"]:
                for job in ["Electrician", "Cleaning", "Internet", "Plumber", "Furniture"]:
                    db.add(models.HousekeepingContact(
                        block_type=block_type,
                        job_profession=job,
                        contact_number=""
                    ))
            db.commit()

        print("Database seeding completed.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_db()
from datetime import datetime
