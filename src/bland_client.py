import httpx
from typing import Dict, Any, Optional
from src.config import settings

class BlandAIClient:
    def __init__(self):
        self.api_key = settings.bland_api_key
        self.base_url = "https://api.bland.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def create_call(
        self,
        phone_number: str,
        task: Optional[str] = None,
        persona_id: Optional[str] = None,
        first_sentence: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        webhook_url: Optional[str] = None,
        max_duration: int = 2,
        voice: str = "maya"
    ) -> Dict[str, Any]:
        """
        Create a new call with Bland AI
        
        Args:
            phone_number: E.164 format (e.g., +14155551234)
            task: Instructions for the agent
            persona_id: Optional Bland persona ID
            first_sentence: Optional override for the opening line
            metadata: Custom data to attach to call
            webhook_url: URL to receive call completion webhook
            max_duration: Max call length in minutes
            voice: Voice to use
        """
        if not task and not persona_id:
            raise ValueError("Either task or persona_id must be provided")

        payload: Dict[str, Any] = {
            "phone_number": phone_number,
            "max_duration": max_duration,
            "record": True,
            "metadata": metadata or {}
        }

        if task:
            payload["task"] = task
            payload["voice"] = voice

        if persona_id:
            payload["persona_id"] = persona_id

        if first_sentence:
            payload["first_sentence"] = first_sentence

        if webhook_url:
            payload["webhook"] = webhook_url

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/calls",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_call(self, call_id: str) -> Dict[str, Any]:
        """Get call details including transcript"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/calls/{call_id}",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def stop_call(self, call_id: str):
        """Stop an active call"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/calls/{call_id}/stop",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

# Global Bland AI client
bland_client = BlandAIClient()
