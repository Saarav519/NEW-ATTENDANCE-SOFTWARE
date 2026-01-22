from fastapi import FastAPI
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=False)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Audix Solutions Staff Management API")

# Root-level health check for Kubernetes (without /api prefix)
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes deployment"""
    return {"status": "healthy"}

# Import and include routes
from routes import router as api_router

# Include the router with /api prefix
app.include_router(api_router, prefix="/api")

# Serve uploaded files
@app.get("/api/uploads/{file_path:path}")
async def serve_upload(file_path: str):
    full_path = f"/app/backend/uploads/{file_path}"
    if os.path.exists(full_path):
        return FileResponse(full_path)
    return {"error": "File not found"}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    # Create uploads directory
    os.makedirs("/app/backend/uploads", exist_ok=True)
    logger.info("Server started - Audix Solutions Staff Management API")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
