"""
API endpoints for roadmap operations
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.roadmap_generator import roadmap_generator_v2

router = APIRouter()


class RoadmapRequest(BaseModel):
    career_domain: str
    skill_level: str
    learning_style: str
    pace_preference: str = "standard"


class RoadmapResponse(BaseModel):
    status: str
    career_domain: str
    skill_level: str
    days: List[dict]
    total_days: int


@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify API routing"""
    return {
        "message": "PathAI AI Service API is working!",
        "status": "success"
    }


@router.post("/roadmaps/generate")
async def generate_roadmap(request: RoadmapRequest):
    """
    Generate a personalized learning roadmap
    """
    try:
        roadmap = await roadmap_generator_v2.generate_roadmap(
            career_domain=request.career_domain,
            skill_level=request.skill_level,
            learning_style=request.learning_style,
            pace_preference=request.pace_preference
        )
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
