from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Student schemas
class StudentPreferences(BaseModel):
    sleep_schedule: Optional[str] = None  # Early Bird / Night Owl
    study_preference: Optional[str] = None  # Silent / Group Study
    cleanliness_level: Optional[str] = None  # High / Medium / Low

class StudentBase(BaseModel):
    roll_number: str
    gender: str
    department: str
    year: int
    phone: str
    emergency_contact: str

class StudentRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    roll_number: str
    gender: str
    department: str
    year: int
    phone: str
    emergency_contact: str

class StudentResponse(BaseModel):
    id: int
    user_id: int
    roll_number: str
    gender: str
    department: str
    year: int
    phone: str
    emergency_contact: str
    sleep_schedule: Optional[str] = None
    study_preference: Optional[str] = None
    cleanliness_level: Optional[str] = None
    roommate_matched_id: Optional[int] = None
    user: UserResponse
    room: Optional[dict] = None

    class Config:
        from_attributes = True

# Room and Block schemas
class HostelBlockBase(BaseModel):
    name: str
    total_floors: int
    gender_type: str

class HostelBlockResponse(HostelBlockBase):
    id: int

    class Config:
        from_attributes = True

class RoomBase(BaseModel):
    block_id: int
    room_number: str
    floor: int
    capacity: int
    status: str
    rent: float

class RoomResponse(RoomBase):
    id: int
    block: HostelBlockResponse

    class Config:
        from_attributes = True

class RoomCreate(RoomBase):
    pass

class RoomAllocationBase(BaseModel):
    student_id: int
    room_id: int

class RoomAllocationResponse(RoomAllocationBase):
    id: int
    allocated_at: datetime
    is_active: bool
    room: RoomResponse
    student: StudentResponse

    class Config:
        from_attributes = True

# Complaint schemas
class ComplaintBase(BaseModel):
    category: str
    title: str
    description: str
    block_id: int
    floor: int

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdateStatus(BaseModel):
    status: str

class ComplaintResponse(ComplaintBase):
    id: int
    student_id: int
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    student: StudentResponse

    class Config:
        from_attributes = True

# LeaveRequest schemas
class LeaveRequestBase(BaseModel):
    start_date: datetime
    end_date: datetime
    reason: str

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(BaseModel):
    status: str
    warden_remarks: Optional[str] = None

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    student_id: int
    status: str
    warden_remarks: Optional[str] = None
    created_at: datetime
    student: StudentResponse

    class Config:
        from_attributes = True

# GatePass schemas
class GatePassBase(BaseModel):
    purpose: str
    exit_time: datetime
    entry_time: datetime

class GatePassCreate(GatePassBase):
    pass

class GatePassResponse(GatePassBase):
    id: int
    student_id: int
    qr_code_data: str
    status: str
    created_at: datetime
    student: StudentResponse

    class Config:
        from_attributes = True

# LostFound schemas
class LostFoundBase(BaseModel):
    item_type: str
    title: str
    description: str
    category: str
    contact_info: str
    image_url: Optional[str] = None

class LostFoundCreate(LostFoundBase):
    pass

class LostFoundResponse(LostFoundBase):
    id: int
    reporter_id: int
    is_resolved: bool
    created_at: datetime
    reporter: UserResponse

    class Config:
        from_attributes = True

# Notification schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Message schemas
class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# HousekeepingContact schemas
class HousekeepingContactBase(BaseModel):
    block_type: str
    job_profession: str
    contact_number: Optional[str] = None

class HousekeepingContactUpdate(BaseModel):
    contact_number: str

class HousekeepingContactResponse(HousekeepingContactBase):
    id: int

    class Config:
        from_attributes = True
