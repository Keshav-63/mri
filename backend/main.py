import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
import bcrypt
from supabase import create_client, Client
from dotenv import load_dotenv

# Import our services
from gemini_service import analyze_mri_file, get_chat_response, get_gemini_chat_stream
from groq_service import get_groq_chat_stream

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI-Integrated MRI Report Analyzer API",
    description="Backend service with custom Auth (no JWT) and Gemini MRI analysis integration.",
    version="2.0.0"
)

# Configure CORS
frontend_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Supabase DB Client Setup for custom tables
# -------------------------------------------------------------
supabase_url = os.getenv("SUPABASE_URL")
# Use service key if available to bypass RLS, otherwise fallback to anon key
supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    logger.warning("Supabase URL or Key is missing. Custom Auth database operations will fail.")
    supabase_client: Client = None
else:
    logger.info("Initializing Supabase Client for custom tables...")
    supabase_client: Client = create_client(supabase_url, supabase_key)

# -------------------------------------------------------------
# Password Hashing Helpers (bcrypt)
# -------------------------------------------------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# -------------------------------------------------------------
# Pydantic Request Models
# -------------------------------------------------------------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ReportSaveRequest(BaseModel):
    user_id: str
    file_name: str
    file_type: str
    file_size: int
    analysis_result: Dict[str, Any]

class ChatMessage(BaseModel):
    role: str  # "user" or "model" (corresponds to 'user' or 'ai' in DB)
    content: str

class ChatRequest(BaseModel):
    report_data: Dict[str, Any]
    message_history: List[ChatMessage]
    new_message: str

# -------------------------------------------------------------
# Auth API Endpoints
# -------------------------------------------------------------
@app.post("/api/auth/signup")
async def signup(request: SignupRequest):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured.")
    
    # 1. Check if email exists
    try:
        response = supabase_client.table("users").select("*").eq("email", request.email.lower()).execute()
        if response.data and len(response.data) > 0:
            raise HTTPException(status_code=400, detail="Email is already registered.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking email existence: {e}")
        raise HTTPException(status_code=500, detail="Database check failed.")

    # 2. Hash password
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    
    hashed_pwd = hash_password(request.password)

    # 3. Insert user record
    try:
        new_user = {
            "email": request.email.lower(),
            "password_hash": hashed_pwd,
            "full_name": request.full_name
        }
        insert_response = supabase_client.table("users").insert(new_user).execute()
        if not insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to create user record.")
        
        user_record = insert_response.data[0]
        # Return user details without password hash
        return {
            "id": user_record["id"],
            "email": user_record["email"],
            "full_name": user_record["full_name"],
            "created_at": user_record["created_at"]
        }
    except Exception as e:
        logger.error(f"Error executing user insert: {e}")
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(e)}")

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured.")
    
    # 1. Fetch user by email
    try:
        response = supabase_client.table("users").select("*").eq("email", request.email.lower()).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        user_record = response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing user query: {e}")
        raise HTTPException(status_code=500, detail="Database read failed.")

    # 2. Verify hashed password
    if not verify_password(request.password, user_record["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # 3. Return user details
    return {
        "id": user_record["id"],
        "email": user_record["email"],
        "full_name": user_record["full_name"],
        "created_at": user_record["created_at"]
    }

# -------------------------------------------------------------
# Reports API Endpoints
# -------------------------------------------------------------
@app.get("/api/reports")
async def get_user_reports(user_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured.")
    
    try:
        response = supabase_client.table("reports").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching user reports: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reports from database.")

@app.post("/api/reports")
async def save_user_report(request: ReportSaveRequest):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured.")
    
    try:
        response = supabase_client.table("reports").insert({
            "user_id": request.user_id,
            "file_name": request.file_name,
            "file_type": request.file_type,
            "file_size": request.file_size,
            "analysis_result": request.analysis_result
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to write report to database.")
            
        return response.data[0]
    except Exception as e:
        logger.error(f"Error inserting report: {e}")
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(e)}")

@app.delete("/api/reports/{report_id}")
async def delete_user_report(report_id: str, user_id: str):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Database client not configured.")
    
    try:
        # Verify ownership and delete
        response = supabase_client.table("reports").delete().eq("id", report_id).eq("user_id", user_id).execute()
        return {"status": "success", "message": "Report deleted."}
    except Exception as e:
        logger.error(f"Error deleting report: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete report.")

# -------------------------------------------------------------
# Core Scan Analysis Endpoints
# -------------------------------------------------------------
@app.post("/api/analyze")
async def analyze_mri(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    """
    Analyzes uploaded scan. If user_id is provided, automatically saves the report
    to the Supabase database.
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Supported: PDF, JPG, JPEG, PNG, WEBP. Received: {ext}"
        )

    # Determine MIME type
    mime_type = file.content_type or "application/octet-stream"

    try:
        file_bytes = await file.read()
        logger.info(f"Analyzing {filename} ({len(file_bytes)} bytes) using Gemini...")
        
        # Analyze using Gemini
        report_result = analyze_mri_file(file_bytes, mime_type)
        
        # If it is a standard image, encode to base64 and store in result dictionary
        if ext in {".jpg", ".jpeg", ".png", ".webp"}:
            import base64
            base64_str = base64.b64encode(file_bytes).decode('utf-8')
            report_result['uploaded_image_base64'] = f"data:{mime_type};base64,{base64_str}"
        
        # If user_id is passed, save directly to database and return the saved database row
        if user_id and supabase_client:
            logger.info(f"Automatically saving report for user {user_id}...")
            save_response = supabase_client.table("reports").insert({
                "user_id": user_id,
                "file_name": filename,
                "file_type": ext.replace('.', ''),
                "file_size": len(file_bytes),
                "analysis_result": report_result
            }).execute()
            
            if save_response.data:
                return save_response.data[0]
        
        # If no user_id or DB client, return the raw analysis dictionary
        return report_result
        
    except ValueError as val_err:
        logger.error(f"Analysis error: {val_err}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Error during scan analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_followup(request: ChatRequest):
    try:
        history = [{"role": msg.role, "content": msg.content} for msg in request.message_history]
        
        # Recursively strip base64 image data or large data URLs to prevent context window overflow
        def clean_report_data(data: Any) -> Any:
            if isinstance(data, dict):
                return {
                    k: clean_report_data(v)
                    for k, v in data.items()
                    if k != "uploaded_image_base64" and not (isinstance(v, str) and (v.startswith("data:image/") or len(v) > 2000))
                }
            elif isinstance(data, list):
                return [clean_report_data(item) for item in data]
            return data

        cleaned_report = clean_report_data(request.report_data)

        def unified_chat_stream():
            use_gemini = False
            if os.getenv("GROQ_API_KEY"):
                try:
                    # Try streaming from Groq
                    for chunk in get_groq_chat_stream(
                        report_data=cleaned_report,
                        message_history=history,
                        new_message=request.new_message
                    ):
                        yield chunk
                except Exception as e:
                    logger.warning(f"Groq streaming failed, falling back to Gemini: {e}")
                    use_gemini = True
            else:
                use_gemini = True

            if use_gemini:
                try:
                    for chunk in get_gemini_chat_stream(
                        report_data=cleaned_report,
                        message_history=history,
                        new_message=request.new_message
                    ):
                        yield chunk
                except Exception as e:
                    logger.error(f"Gemini fallback chat streaming failed: {e}")
                    yield f"\n\n[Assistant Error: Chat assistant is temporarily unavailable. Please verify API configuration.]"

        return StreamingResponse(unified_chat_stream(), media_type="text/plain")
    except Exception as e:
        logger.error(f"Error in chat streaming endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {
        "status": "online",
        "custom_auth": True,
        "supabase_connected": supabase_client is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
