from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # student, warden, admin
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

class HostelBlock(Base):
    __tablename__ = "hostel_blocks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # Block A, Block B, Girls Hostel, Boys Hostel
    total_floors = Column(Integer, nullable=False)
    gender_type = Column(String, nullable=False)  # Male, Female, Co-ed

    # Relationships
    rooms = relationship("Room", back_populates="block")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("hostel_blocks.id"), nullable=False)
    room_number = Column(String, nullable=False)
    floor = Column(Integer, nullable=False)
    capacity = Column(Integer, default=2)
    status = Column(String, default="Available")  # Available, Occupied, Maintenance
    rent = Column(Float, default=1500.0)

    # Relationships
    block = relationship("HostelBlock", back_populates="rooms")
    allocations = relationship("RoomAllocation", back_populates="room")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = Column(String, unique=True, nullable=False)
    gender = Column(String, nullable=False)
    department = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    phone = Column(String, nullable=False)
    emergency_contact = Column(String, nullable=False)

    # Expanded details fields
    fees_paid = Column(Boolean, default=False)
    location = Column(String, nullable=True)
    parents_name = Column(String, nullable=True)
    parents_contact = Column(String, nullable=True)
    locality = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # Roommate Preferences
    sleep_schedule = Column(String, nullable=True)  # Early Bird / Night Owl
    study_preference = Column(String, nullable=True)  # Silent / Group Study
    cleanliness_level = Column(String, nullable=True)  # High / Medium / Low
    roommate_matched_id = Column(Integer, ForeignKey("students.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    allocations = relationship("RoomAllocation", back_populates="student")
    complaints = relationship("Complaint", back_populates="student")
    leave_requests = relationship("LeaveRequest", back_populates="student")
    gate_passes = relationship("GatePass", back_populates="student")

    @property
    def room(self):
        for alloc in self.allocations:
            if alloc.is_active:
                return {
                    "id": alloc.room.id,
                    "room_number": alloc.room.room_number,
                    "block_name": alloc.room.block.name
                }
        return None

class RoomAllocation(Base):
    __tablename__ = "room_allocations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    allocated_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    student = relationship("Student", back_populates="allocations")
    room = relationship("Room", back_populates="allocations")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    category = Column(String, nullable=False)  # Electrical, Plumbing, Internet, Cleaning, Furniture, Other
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    block_id = Column(Integer, ForeignKey("hostel_blocks.id"), nullable=False)
    floor = Column(Integer, nullable=False)
    status = Column(String, default="Pending")  # Pending, In Progress, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="complaints")
    block = relationship("HostelBlock")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected
    warden_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="leave_requests")

class GatePass(Base):
    __tablename__ = "gate_passes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    purpose = Column(String, nullable=False)
    exit_time = Column(DateTime, nullable=False)
    entry_time = Column(DateTime, nullable=False)
    qr_code_data = Column(String, nullable=False)
    status = Column(String, default="Generated")  # Generated, Active, Expired, Returned
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="gate_passes")

class LostFound(Base):
    __tablename__ = "lost_found"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_type = Column(String, nullable=False)  # Lost, Found
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    contact_info = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class HousekeepingContact(Base):
    __tablename__ = "housekeeping_contacts"

    id = Column(Integer, primary_key=True, index=True)
    block_type = Column(String, nullable=False)  # "Boys" or "Girls"
    job_profession = Column(String, nullable=False)  # "Electrician", "Cleaning", "Internet", "Plumbing", "Furniture"
    contact_number = Column(String, nullable=True)
