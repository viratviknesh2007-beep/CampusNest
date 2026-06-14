import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import google.generativeai as genai
from ..database import get_db
from .. import models, auth

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
has_gemini = False

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        has_gemini = True
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat_assistant(request: ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    user_name = current_user.full_name
    role = current_user.role
    
    prompt = f"""You are 'Nestor', the AI Hostel Assistant for 'CampusNest'. 
The user talking to you is {user_name}, who is a {role} at the hostel.
Provide helpful, concise, and polite assistance regarding hostel guidelines, room allocations, leave applications, gate passes, or complaint tracking.
User's query: "{request.message}"
Nestor response:"""

    if has_gemini:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini execution error: {e}")
            # Fall through to mock

    # Mock responses matching key phrases
    msg = request.message.lower()
    if "room" in msg or "allocate" in msg:
        reply = "Rooms are allocated by the Hostel Administrator. Students can view room assignments on their dashboard under 'Room Allocation Details'. If you need a room change, please file a complaint under 'Furniture/Other' or contact the Admin."
    elif "leave" in msg or "apply" in msg:
        reply = "You can apply for leave by going to the 'Apply for Leave' section in the Student Portal. Fill in the start and end dates and provide a valid reason. Your hostel warden will review and approve/reject it."
    elif "gate" in msg or "pass" in msg or "qr" in msg:
        reply = "The Digital QR Gate Pass is generated automatically in your student portal. Show the QR pass at the security desk upon exiting or entering. The gate pass status will be scanned and updated by security."
    elif "complaint" in msg:
        reply = "To submit a complaint, go to 'Submit Complaints' in your portal, choose a category (Electrical, Plumbing, Internet, Cleaning, Furniture, or Other), write a summary, and click submit. You can track status directly on the dashboard."
    elif "sos" in msg or "emergency" in msg:
        reply = "If there is a safety or health emergency, click the red SOS Button on your dashboard. It immediately broadcasts high-priority alarms to all wardens and security desks with your name and room number."
    else:
        reply = f"Hello {user_name}! I am Nestor, your CampusNest assistant. I can help you register complaints, check leave statuses, generate QR gate passes, check roommate compatibility, or view room allocations. Let me know how I can help!"

    return {"reply": reply}

@router.get("/roommate-recommendations")
def get_roommate_recommendations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can get roommate matching recommendations")
        
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # If preferences not set, return a message
    if not student.sleep_schedule or not student.study_preference or not student.cleanliness_level:
        return {
            "status": "preferences_required",
            "message": "Please set your sleep schedule, study preference, and cleanliness habits to get roommate matches."
        }

    # Fetch all students excluding self
    all_students = db.query(models.Student).filter(models.Student.id != student.id).all()
    matches = []

    for s in all_students:
        # Check if student s has preferences
        if not s.sleep_schedule or not s.study_preference or not s.cleanliness_level:
            continue
            
        # Match calculation:
        score = 0
        reasons = []
        
        if s.sleep_schedule == student.sleep_schedule:
            score += 35
            reasons.append(f"Both are {s.sleep_schedule}s")
        else:
            reasons.append("Different sleeping routines")
            
        if s.study_preference == student.study_preference:
            score += 35
            reasons.append(f"Shared study style ({s.study_preference})")
        else:
            reasons.append("Different study environments")
            
        if s.cleanliness_level == student.cleanliness_level:
            score += 20
            reasons.append("Matching cleanliness habits")
            
        if s.department == student.department:
            score += 10
            reasons.append(f"Same department ({s.department})")
            
        # Normalize score
        score = min(score, 100)
        
        # Get student's user info
        user_info = db.query(models.User).filter(models.User.id == s.user_id).first()
        
        matches.append({
            "student_id": s.id,
            "roll_number": s.roll_number,
            "full_name": user_info.full_name,
            "department": s.department,
            "year": s.year,
            "compatibility": score,
            "reasons": reasons
        })
        
    # Sort matches by compatibility score
    matches.sort(key=lambda x: x["compatibility"], reverse=True)
    return {
        "status": "success",
        "matches": matches[:5]
    }

@router.get("/complaint-trends")
def get_complaint_trends(db: Session = Depends(get_db)):
    # Calculate most common categories and blocks
    complaints = db.query(models.Complaint).all()
    if not complaints:
        return {"summary": "No complaints registered yet. The hostel operations are running smoothly!"}
        
    categories = {}
    blocks = {}
    for c in complaints:
        categories[c.category] = categories.get(c.category, 0) + 1
        blocks[c.block.name if c.block else "Unknown"] = blocks.get(c.block.name if c.block else "Unknown", 0) + 1

    top_category = max(categories, key=categories.get) if categories else "None"
    top_block = max(blocks, key=blocks.get) if blocks else "None"
    
    analysis_text = f"Top issues category is '{top_category}' and the most affected region is '{top_block}' block. Overall complaints registered: {len(complaints)}."

    if has_gemini:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"Write a professional, single-paragraph AI analysis summary of these hostel complaints for a warden dashboard: Categories count: {categories}. Blocks count: {blocks}. Identify trends and suggest actions (e.g. call plumber if plumbing issues are high)."
            response = model.generate_content(prompt)
            return {"summary": response.text.strip()}
        except Exception as e:
            print(f"Gemini execution error: {e}")

    # Rich default summary
    summary = f"AI Analysis: {top_category} complaints are currently dominant, accounting for the majority of the tickets. The most affected building is {top_block} Block. Recommendation: Schedule preventive maintenance checks for {top_category} installations in {top_block} Block."
    return {"summary": summary}
