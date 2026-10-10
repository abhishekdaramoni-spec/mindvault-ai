"""Ollama API Service for local language model inference and health checking."""
import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaService:
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL

    async def check_health(self) -> Dict[str, Any]:
        """Check if Ollama server is reachable and return available models."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    is_model_present = any(self.model in m or m.startswith(self.model) for m in models)
                    return {
                        "is_reachable": True,
                        "models": models,
                        "selected_model": self.model,
                        "model_available": is_model_present,
                        "message": "Connected successfully" if is_model_present else f"Connected to Ollama, but model '{self.model}' is not in local list."
                    }
                return {
                    "is_reachable": False,
                    "models": [],
                    "selected_model": self.model,
                    "model_available": False,
                    "message": f"Ollama returned HTTP status {res.status_code}"
                }
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return {
                "is_reachable": False,
                "models": [],
                "selected_model": self.model,
                "model_available": False,
                "message": f"Could not reach Ollama at {self.base_url}. Ensure Ollama is running."
            }

    async def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> str:
        """Call Ollama generate endpoint."""
        health = await self.check_health()
        if not health["is_reachable"]:
            raise RuntimeError(f"Ollama is unreachable at {self.base_url}. Please ensure 'ollama serve' is running.")

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }
        if system_prompt:
            payload["system"] = system_prompt

        timeout = httpx.Timeout(settings.OLLAMA_TIMEOUT_SECONDS, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(f"{self.base_url}/api/generate", json=payload)
            if res.status_code != 200:
                raise RuntimeError(f"Ollama generation failed ({res.status_code}): {res.text}")
            data = res.json()
            return data.get("response", "").strip()


ollama_service = OllamaService()
