"""
Gemini AI client configuration for PathAI
Using the new google-genai SDK with Robust Retry Logic
"""
from google import genai
from google.genai import types
import json
import logging
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash"]

def get_client() -> genai.Client:
    """Get configured Gemini client"""
    return genai.Client(api_key=settings.GEMINI_API_KEY)

async def _generate_with_fallback(prompt: str, temperature: float, is_json: bool = False):
    """
    Attempt generation with fallback models
    """
    client = get_client()
    last_exception = None

    for model_name in MODELS:
        try:
            logger.info(f"Attempting generation with model: {model_name}")
            config = types.GenerateContentConfig(
                temperature=temperature,
                response_mime_type="application/json" if is_json else "text/plain"
            )
            
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            return response
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {str(e)}")
            last_exception = e
            # If it's a 429 (Resource Exhausted), we continue to next model
            # For other errors, we might deciding to continue or raise
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                continue
            else:
                # If it's not a rate limit, maybe we still try the next model? 
                # Let's be robust and try next.
                continue
    
    # If we exhaust all models
    if last_exception:
        raise last_exception
    raise Exception("All models failed generation")

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING)
)
async def generate_content(prompt: str, temperature: float = 0.7) -> str:
    """
    Generate content with retry and fallback
    """
    try:
        response = await _generate_with_fallback(prompt, temperature, is_json=False)
        return response.text
    except Exception as e:
        logger.error(f"Final generation failure: {e}")
        raise

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING)
)
async def generate_json_content(prompt: str, temperature: float = 0.7) -> dict:
    """
    Generate JSON content with retry and fallback
    """
    try:
        response = await _generate_with_fallback(prompt, temperature, is_json=True)
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback cleanup for common JSON issues
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
    except Exception as e:
        logger.error(f"Final JSON generation failure: {e}")
        raise
