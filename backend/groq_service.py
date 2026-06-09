import os
import json
import logging
from typing import List, Dict, Any
import httpx

logger = logging.getLogger(__name__)

# Retrieve Groq API key from environment
groq_api_key = os.getenv("GROQ_API_KEY")

def get_groq_chat_stream(report_data: Dict[str, Any], message_history: List[Dict[str, str]], new_message: str):
    """
    Communicates with Groq API (openai/gpt-oss-120b) to generate a follow-up streaming answer
    regarding the MRI analysis report.
    """
    if not groq_api_key:
        logger.warning("GROQ_API_KEY is not configured in backend environment variables.")
        raise ValueError("GROQ_API_KEY is missing.")

    # 1. Compile the clinical context
    context_str = json.dumps(report_data, indent=2)
    system_prompt = (
        f"You are RadSight Assistant, a helpful, empathetic medical AI assistant. "
        f"A patient or doctor is asking you questions about the following MRI/radiology analysis report:\n\n"
        f"{context_str}\n\n"
        f"Guidelines:\n"
        f"1. Refer strictly to the findings, layman explanations, and recommendations in the report to answer the user.\n"
        f"2. Keep your answers clear, supportive, and informative.\n"
        f"3. Explain medical jargon in plain English when talking to a patient.\n"
        f"4. Always include a reminder that you are an AI assistant and they should consult their doctor for clinical decisions."
    )

    # 2. Format history for Groq (OpenAI-compatible)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in message_history:
        # Map frontend roles to OpenAI standard roles ('user' or 'assistant')
        role = "assistant" if msg["role"] in ("model", "ai", "assistant") else "user"
        messages.append({"role": role, "content": msg["content"]})
    
    # Append the new prompt
    messages.append({"role": "user", "content": new_message})

    # 3. Call Groq completions endpoint with stream=True
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 2048,
        "stream": True
    }

    try:
        logger.info("Sending streaming chat query to Groq API...")
        with httpx.stream("POST", url, headers=headers, json=payload, timeout=20.0) as r:
            if r.status_code >= 400:
                # Read error body
                r.read()
                error_details = r.text
                logger.error(f"Groq API returned error status {r.status_code}: {error_details}")
                raise ValueError(f"Groq API error ({r.status_code}): {error_details}")
            
            for line in r.iter_lines():
                if line.startswith("data:"):
                    data_str = line[5:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data_json = json.loads(data_str)
                        chunk_text = data_json["choices"][0]["delta"].get("content", "")
                        if chunk_text:
                            yield chunk_text
                    except Exception:
                        pass
    except Exception as e:
        logger.error(f"Error querying Groq streaming API: {e}")
        raise ValueError(f"Groq API streaming failed: {str(e)}")
