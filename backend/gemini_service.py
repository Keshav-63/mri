import os
import json
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Google GenAI API key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY not found in environment variables.")

# -------------------------------------------------------------
# Structured Pydantic Models for Gemini Output
# -------------------------------------------------------------

class FindingCoordinate(BaseModel):
    x: float = Field(..., description="X coordinate of top-left corner of the bounding box as percentage (0-100) of image width")
    y: float = Field(..., description="Y coordinate of top-left corner of the bounding box as percentage (0-100) of image height")
    width: float = Field(..., description="Width of the bounding box as percentage (0-100) of image width")
    height: float = Field(..., description="Height of the bounding box as percentage (0-100) of image height")

class Finding(BaseModel):
    label: str = Field(..., description="Short finding label, e.g. 'Mild disc bulge at L4-L5'")
    category: str = Field(..., description="Anatomical category, e.g., 'Spine', 'Joints', 'Tissues', 'Bones'")
    details: str = Field(..., description="Detailed clinical description of the finding")
    slices: str = Field(..., description="Range of slices where this is visible, e.g., '42-49'")
    severity: int = Field(..., description="Severity score from 1 (minimal/normal) to 5 (severe)")
    confidence: int = Field(..., description="Confidence level as a percentage (e.g. 91)")
    views: List[str] = Field(..., description="Views where this is visible (e.g., ['axial', 'sagittal'])")
    coordinates: Optional[FindingCoordinate] = Field(..., description="Coordinates to highlight the abnormality on the slice")

class LaymanFinding(BaseModel):
    title: str = Field(..., description="Simple name of the finding, e.g., 'Bulging Disc in Lower Back'")
    explanation: str = Field(..., description="Easy explanation for non-medical user")
    implications: str = Field(..., description="What this means practically for the patient")

class LaymanExplanation(BaseModel):
    summary: str = Field(..., description="Simplified summary of the overall scan results")
    findings: List[LaymanFinding] = Field(..., description="Patient-friendly translation of clinical findings")
    lifestyle_suggestions: List[str] = Field(..., description="List of suggestions for exercises, posture, next steps, etc.")

class AnalysisReport(BaseModel):
    patient_name: str = Field(..., description="Name of the patient from scan, default 'Patient'")
    scan_type: str = Field(..., description="Type of scan, e.g., 'Knee MRI', 'Lumbar Spine MRI'")
    study_name: str = Field(..., description="Full study name, e.g., 'Right Knee MRI Study'")
    series_name: str = Field(..., description="MRI series/sequence name, e.g., 'T1 Dixon AXI' or 'T2 FLAIR SAG'")
    study_date: str = Field(..., description="Date of scan acquisition if detectable from file, otherwise 'Not specified'")
    impression: List[str] = Field(..., description="Key diagnostic impression bullet points")
    findings: List[Finding] = Field(..., description="List of clinical findings")
    layman_explanation: LaymanExplanation = Field(..., description="Layman friendly translation of findings")
    key_points: List[str] = Field(..., description="3-5 concise plain-English key takeaways for the patient about this scan")
    next_steps: List[str] = Field(..., description="3-5 concrete recommended next steps for the patient to take after reading this report")
    questions_to_ask: List[str] = Field(..., description="3-4 smart questions the patient should ask their doctor at their next appointment")
    recommendations: List[str] = Field(..., description="Clinical recommendations for follow-up")
    safety_notes: List[str] = Field(..., description="2-4 red-flag symptoms that require urgent medical attention")
    disclaimer: str = Field(..., description="Medical AI safety disclaimer")

# -------------------------------------------------------------
# Gemini Service Implementation
# -------------------------------------------------------------

def analyze_mri_file(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Sends the uploaded file (image/PDF) to Gemini API with strict system instructions
    to perform a structured medical analysis returning the AnalysisReport schema.
    """
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured on the backend server.")

    # Configure model selection. We use gemini-2.5-flash which is free-tier eligible and fast.
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": AnalysisReport,
            "temperature": 0.2
        }
    )

    system_instruction = (
        "You are an expert board-certified radiologist AI assistant. "
        "Analyze the provided medical scan image or PDF report. "
        "Identify anatomical details, abnormalities, effusion, tears, lesions, and other issues. "
        "Create a detailed clinical report and translate it into a patient-friendly Layman Explanation. "
        "Assign affected slice ranges, severity values (1 to 5), confidence values, and approximate "
        "bounding box coordinates (x, y, width, height as 0-100 percentages) representing the location "
        "of the abnormalities in the image context. "
        "Also generate: concise key_points for the patient, practical next_steps they should take, "
        "smart questions_to_ask their doctor, safety_notes with urgent red-flag symptoms, "
        "plus study_name, series_name, and study_date extracted or inferred from the scan."
    )

    prompt = (
        "Perform a thorough radiology analysis of this uploaded MRI file. "
        "Extract the scan/study type, series name, and scan date if visible. "
        "List key diagnostic impressions, fill clinical findings with categories, "
        "slice ranges, severity ratings, confidence levels, views, and coordinate bounding boxes. "
        "Provide a detailed layman translation with key_points (plain English takeaways), "
        "next_steps (what the patient should do), questions_to_ask (for their doctor), "
        "and safety_notes (urgent red-flag symptoms). "
        "Also generate lifestyle guidance and clinical follow-up recommendations, "
        "plus a standard medical AI safety disclaimer."
    )

    # Format the file content for Gemini
    file_part = {
        "mime_type": mime_type,
        "data": file_bytes
    }

    logger.info(f"Sending MRI file of type {mime_type} to Gemini API for structured analysis...")
    
    # Call Gemini model
    response = model.generate_content(
        contents=[file_part, prompt],
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": AnalysisReport,
            "temperature": 0.2
        }
    )

    logger.info("Successfully received structured response from Gemini.")
    
    # Parse JSON output and return dict
    try:
        report_data = json.loads(response.text)
        return report_data
    except Exception as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}. Raw response: {response.text}")
        raise ValueError("The AI service returned an invalid report format. Please try again.")

def get_chat_response(report_data: Dict[str, Any], message_history: List[Dict[str, str]], new_message: str) -> str:
    """
    Continues a chat conversation with the user regarding their MRI report.
    Feeds the report data as context to the Gemini model.
    """
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured on the backend server.")

    # We use gemini-2.5-flash for conversational chat
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={"temperature": 0.5}
    )

    # Compile the chat prompt with report context
    context_str = json.dumps(report_data, indent=2)
    system_prompt = (
        f"You are RadSight Assistant, a helpful, empathetic medical AI assistant. "
        f"A patient or doctor is asking you questions about the following MRI analysis report:\n\n"
        f"{context_str}\n\n"
        f"Guidelines:\n"
        f"1. Refer to the findings, layman explanations, and recommendations in the report to answer the user.\n"
        f"2. Keep your answers clear, supportive, and informative.\n"
        f"3. Explain medical jargon in plain English when talking to a patient.\n"
        f"4. Always include a reminder that you are an AI assistant and they should consult their doctor for clinical decisions."
    )

    # Format chat history in standard Gemini contents list
    contents = [system_prompt]
    for msg in message_history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(f"{role}: {msg['content']}")
    
    contents.append(f"user: {new_message}")

    logger.info("Sending chat query with report context to Gemini...")
    response = model.generate_content(contents)
    logger.info("Received chat response from Gemini.")
    
    return response.text

def get_gemini_chat_stream(report_data: Dict[str, Any], message_history: List[Dict[str, str]], new_message: str):
    """
    Yields chunks of conversational response from Gemini.
    """
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured on the backend server.")

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={"temperature": 0.5}
    )

    context_str = json.dumps(report_data, indent=2)
    system_prompt = (
        f"You are RadSight Assistant, a helpful, empathetic medical AI assistant. "
        f"A patient or doctor is asking you questions about the following MRI analysis report:\n\n"
        f"{context_str}\n\n"
        f"Guidelines:\n"
        f"1. Refer to the findings, layman explanations, and recommendations in the report to answer the user.\n"
        f"2. Keep your answers clear, supportive, and informative.\n"
        f"3. Explain medical jargon in plain English when talking to a patient.\n"
        f"4. Always include a reminder that you are an AI assistant and they should consult their doctor for clinical decisions."
    )

    contents = [system_prompt]
    for msg in message_history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(f"{role}: {msg['content']}")
    
    contents.append(f"user: {new_message}")

    logger.info("Sending streaming chat query with report context to Gemini...")
    response = model.generate_content(contents, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text
