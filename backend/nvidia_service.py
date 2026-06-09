import os
import json
import base64
import logging
import re
import requests
from typing import List, Optional, Dict, Any, Generator
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL = "google/gemma-3n-e2b-it"

# ─── Pydantic response models (unchanged — used for documentation/validation) ──

class FindingCoordinate(BaseModel):
    x: float = Field(..., description="X of top-left corner as % of image width (0-100)")
    y: float = Field(..., description="Y of top-left corner as % of image height (0-100)")
    width: float = Field(..., description="Width as % of image width (0-100)")
    height: float = Field(..., description="Height as % of image height (0-100)")

class Finding(BaseModel):
    label: str
    category: str
    details: str
    slices: str
    severity: int
    confidence: int
    views: List[str]
    coordinates: Optional[FindingCoordinate] = None

class LaymanFinding(BaseModel):
    title: str
    explanation: str
    implications: str

class LaymanExplanation(BaseModel):
    summary: str
    findings: List[LaymanFinding]
    lifestyle_suggestions: List[str]

class AnalysisReport(BaseModel):
    patient_name: str
    scan_type: str
    study_name: str
    series_name: str
    study_date: str
    impression: List[str]
    findings: List[Finding]
    layman_explanation: LaymanExplanation
    key_points: List[str]
    next_steps: List[str]
    questions_to_ask: List[str]
    recommendations: List[str]
    safety_notes: List[str]
    disclaimer: str

# ─── JSON schema embedded in prompt ────────────────────────────────────────────

_JSON_SCHEMA = """{
  "patient_name": "string",
  "scan_type": "string",
  "study_name": "string",
  "series_name": "string",
  "study_date": "string",
  "impression": [
    "Detailed diagnostic impression sentence 1",
    "Detailed diagnostic impression sentence 2",
    "Detailed diagnostic impression sentence 3"
  ],
  "findings": [
    {
      "label": "Short descriptive label of finding",
      "category": "Anatomical category e.g. Liver / Spine / Joints / Soft Tissue",
      "details": "2-4 sentence detailed clinical description of the finding, including signal characteristics, location, size estimate, and clinical significance",
      "slices": "Slice range e.g. 12-18",
      "severity": 3,
      "confidence": 88,
      "views": ["axial"],
      "coordinates": {
        "x": 35.0,
        "y": 28.0,
        "width": 30.0,
        "height": 35.0
      }
    }
  ],
  "layman_explanation": {
    "summary": "2-3 sentence plain-English overall summary of what was found and what it means for the patient",
    "findings": [
      {
        "title": "Simple name of the finding",
        "explanation": "2-3 sentence easy explanation using no medical jargon",
        "implications": "What this means practically — should the patient be worried, what happens next"
      }
    ],
    "lifestyle_suggestions": [
      "Specific lifestyle suggestion 1",
      "Specific lifestyle suggestion 2",
      "Specific lifestyle suggestion 3"
    ]
  },
  "key_points": [
    "Plain-English key point 1",
    "Plain-English key point 2",
    "Plain-English key point 3",
    "Plain-English key point 4",
    "Plain-English key point 5"
  ],
  "next_steps": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3",
    "Specific action 4"
  ],
  "questions_to_ask": [
    "Smart question 1 for doctor",
    "Smart question 2 for doctor",
    "Smart question 3 for doctor",
    "Smart question 4 for doctor"
  ],
  "recommendations": [
    "Clinical recommendation 1",
    "Clinical recommendation 2",
    "Clinical recommendation 3"
  ],
  "safety_notes": [
    "Red-flag symptom requiring urgent care 1",
    "Red-flag symptom requiring urgent care 2",
    "Red-flag symptom requiring urgent care 3"
  ],
  "disclaimer": "Full medical AI safety disclaimer text"
}"""

# ─── Helpers ────────────────────────────────────────────────────────────────────

def _headers(stream: bool = False) -> dict:
    return {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "text/event-stream" if stream else "application/json",
        "Content-Type": "application/json",
    }

def _pdf_first_page_to_png_b64(pdf_bytes: bytes) -> str:
    """Render the first page of a PDF to a PNG and return base64."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2× zoom
        png_bytes = pix.tobytes("png")
        doc.close()
        return base64.b64encode(png_bytes).decode("utf-8")
    except ImportError:
        raise ValueError(
            "PyMuPDF is required to analyse PDF files. "
            "Install it with: pip install PyMuPDF"
        )

def _extract_json(text: str) -> dict:
    """Parse JSON from model output, handling markdown code fences."""
    stripped = text.strip()

    # 1. Direct parse
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    # 2. Strip markdown fences
    for pattern in (r'```json\s*([\s\S]*?)\s*```', r'```\s*([\s\S]*?)\s*```'):
        m = re.search(pattern, stripped)
        if m:
            try:
                return json.loads(m.group(1))
            except json.JSONDecodeError:
                pass

    # 3. Grab outermost { ... }
    m = re.search(r'\{[\s\S]*\}', stripped)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from model output. Preview: {text[:300]}")

# ─── Analysis ───────────────────────────────────────────────────────────────────

def analyze_mri_file(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """Send the uploaded scan to the NVIDIA API and return a structured report dict."""
    if not NVIDIA_API_KEY:
        raise ValueError("NVIDIA_API_KEY is not configured on the backend server.")

    # PDFs → render first page to PNG
    if "pdf" in mime_type or mime_type == "application/octet-stream":
        b64 = _pdf_first_page_to_png_b64(file_bytes)
        img_mime = "image/png"
    else:
        b64 = base64.b64encode(file_bytes).decode("utf-8")
        img_mime = mime_type

    prompt = (
        "You are a senior board-certified radiologist with 20 years of experience reading MRI, CT, and X-ray scans.\n\n"
        "TASK: Perform a comprehensive, detailed radiology analysis of the medical scan image provided.\n\n"

        "STEP 1 — VISUAL INSPECTION:\n"
        "Carefully examine every region of the image. Identify ALL visible structures, abnormalities, "
        "masses, lesions, effusions, tears, signal changes, enhancing regions, atrophy, asymmetry, and "
        "incidental findings. Do not skip anything.\n\n"

        "STEP 2 — BOUNDING BOX COORDINATES:\n"
        "For each finding, provide the bounding box of the abnormality AS IT APPEARS IN THIS IMAGE.\n"
        "Coordinate system: the image is a square where (0,0) is TOP-LEFT and (100,100) is BOTTOM-RIGHT.\n"
        "x = percentage from left edge to LEFT side of the abnormality\n"
        "y = percentage from top edge to TOP of the abnormality\n"
        "width = percentage width of the bounding box\n"
        "height = percentage height of the bounding box\n"
        "Example: a mass in the centre-left of the image covering ~30% of the image would be:\n"
        '  {"x": 10, "y": 30, "width": 35, "height": 40}\n'
        "Look carefully at where EXACTLY in the image the abnormality is located before writing coordinates.\n\n"

        "STEP 3 — OUTPUT FORMAT:\n"
        "Return ONLY a valid JSON object exactly matching this schema. No markdown, no code fences, "
        "no explanation before or after. Start with { and end with }.\n\n"
        f"{_JSON_SCHEMA}\n\n"

        "STRICT REQUIREMENTS:\n"
        "- findings: list ALL abnormalities found (minimum 1, include all visible issues)\n"
        "- Each finding 'details' field: minimum 2 detailed sentences describing signal characteristics, "
        "exact anatomical location, estimated size, and clinical significance\n"
        "- impression: minimum 3 detailed bullet points summarising the overall diagnostic impression\n"
        "- key_points: exactly 5 plain-English takeaways for the patient\n"
        "- next_steps: exactly 4 specific actions the patient should take\n"
        "- questions_to_ask: exactly 4 smart questions for their doctor\n"
        "- recommendations: minimum 3 detailed clinical follow-up recommendations\n"
        "- safety_notes: exactly 3 specific red-flag symptoms requiring urgent care\n"
        "- layman_explanation summary: 2-3 sentences in plain English, no jargon\n"
        "- Each layman finding explanation: 2-3 sentences, no medical jargon\n"
        "- lifestyle_suggestions: minimum 3 specific, actionable suggestions\n"
        "- severity: integer 1-5 (1=minimal, 2=mild, 3=moderate, 4=high, 5=critical)\n"
        "- confidence: integer 0-100\n"
        "- disclaimer: full 2-sentence medical AI safety disclaimer\n\n"
        "Return ONLY the JSON object:"
    )

    payload = {
        "model": NVIDIA_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:{img_mime};base64,{b64}"}},
                ],
            }
        ],
        "max_tokens": 8192,
        "temperature": 0.15,
        "top_p": 0.70,
        "frequency_penalty": 0.00,
        "presence_penalty": 0.00,
        "stream": False,
    }

    logger.info(f"Sending scan to NVIDIA API (model: {NVIDIA_MODEL})…")
    resp = requests.post(NVIDIA_BASE_URL, headers=_headers(), json=payload, timeout=120)
    resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"]
    logger.info("Received NVIDIA response — parsing JSON…")

    try:
        return _extract_json(content)
    except Exception as exc:
        logger.error(f"JSON parse failed: {exc}\nRaw output (first 500 chars): {content[:500]}")
        raise ValueError("The AI service returned an invalid report format. Please try again.")


# ─── Chat (non-streaming) ────────────────────────────────────────────────────────

def get_chat_response(
    report_data: Dict[str, Any],
    message_history: List[Dict[str, str]],
    new_message: str,
) -> str:
    if not NVIDIA_API_KEY:
        raise ValueError("NVIDIA_API_KEY is not configured on the backend server.")

    system_content = (
        "You are RadSight Assistant, a helpful, empathetic medical AI assistant. "
        "A patient or doctor is asking questions about the following MRI analysis report:\n\n"
        f"{json.dumps(report_data, indent=2)}\n\n"
        "Guidelines:\n"
        "1. Base your answers on the report's findings, explanations, and recommendations.\n"
        "2. Be clear, supportive, and informative.\n"
        "3. Explain medical jargon in plain English when speaking to a patient.\n"
        "4. Always remind the user that you are an AI and they should consult their doctor for clinical decisions."
    )

    messages = [{"role": "system", "content": system_content}]
    for msg in message_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})

    payload = {
        "model": NVIDIA_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.50,
        "top_p": 0.70,
        "stream": False,
    }

    logger.info("Sending chat query to NVIDIA API…")
    resp = requests.post(NVIDIA_BASE_URL, headers=_headers(), json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ─── Chat (streaming) ────────────────────────────────────────────────────────────

def get_nvidia_chat_stream(
    report_data: Dict[str, Any],
    message_history: List[Dict[str, str]],
    new_message: str,
) -> Generator[str, None, None]:
    if not NVIDIA_API_KEY:
        raise ValueError("NVIDIA_API_KEY is not configured on the backend server.")

    system_content = (
        "You are RadSight Assistant, a helpful, empathetic medical AI assistant. "
        "A patient or doctor is asking questions about the following MRI analysis report:\n\n"
        f"{json.dumps(report_data, indent=2)}\n\n"
        "Guidelines:\n"
        "1. Base your answers on the report's findings, explanations, and recommendations.\n"
        "2. Be clear, supportive, and informative.\n"
        "3. Explain medical jargon in plain English when speaking to a patient.\n"
        "4. Always remind the user that you are an AI and they should consult their doctor for clinical decisions."
    )

    messages = [{"role": "system", "content": system_content}]
    for msg in message_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})

    payload = {
        "model": NVIDIA_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.50,
        "top_p": 0.70,
        "stream": True,
    }

    logger.info("Starting NVIDIA streaming chat…")
    resp = requests.post(
        NVIDIA_BASE_URL,
        headers=_headers(stream=True),
        json=payload,
        stream=True,
        timeout=60,
    )
    resp.raise_for_status()

    for raw_line in resp.iter_lines():
        if not raw_line:
            continue
        decoded = raw_line.decode("utf-8")
        if not decoded.startswith("data: "):
            continue
        data_str = decoded[6:]
        if data_str.strip() == "[DONE]":
            break
        try:
            chunk = json.loads(data_str)
            delta = chunk["choices"][0]["delta"].get("content", "")
            if delta:
                yield delta
        except (json.JSONDecodeError, KeyError, IndexError):
            continue
