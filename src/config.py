from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Ghost Database
    ghost_db_id: str
    ghost_connection_string: str
    
    # Aerospike
    aerospike_host: str = "localhost"
    aerospike_port: int = 3000
    aerospike_namespace: str = "apartment_agent"
    
    # Bland AI
    bland_api_key: str
    bland_persona_id: Optional[str] = None
    bland_poll_interval_seconds: int = 3
    bland_poll_timeout_seconds: int = 180
    
    # AWS Bedrock
    aws_region: str = "us-west-2"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Webhook base URL
    webhook_base_url: str = "http://localhost:8000"

    # Auth0 / Google Calendar
    auth0_domain: Optional[str] = None
    auth0_management_client_id: Optional[str] = None
    auth0_management_client_secret: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None

    # Airbyte
    airbyte_client_id: Optional[str] = None
    airbyte_client_secret: Optional[str] = None
    airbyte_connection_id: Optional[str] = None
    rent_cast_api: Optional[str] = None
    
    class Config:
        env_file = ("backend/.env", ".env", ".env.local")
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env

settings = Settings()
