"""
API endpoints for roadmap and quiz operations
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.services.roadmap_generator import roadmap_generator_v2
from app.services.quiz_generator import quiz_generator
from app.schemas.quiz import QuizRequest, QuizResponse

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


@router.post("/quiz/generate", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """
    Generate 5 MCQ questions for a roadmap day assessment
    
    Request body:
        - career_domain: Career path (e.g., "data_science_ai")
        - day_number: Day number (1-10)
        - day_title: Optional title of the day
        - topics: Key topics for this day
        - objectives: Learning objectives
    
    Returns:
        QuizResponse with 5 MCQ questions
    """
    try:
        quiz = await quiz_generator.generate_quiz(
            career_domain=request.career_domain,
            day_number=request.day_number,
            day_title=request.day_title,
            topics=request.topics,
            objectives=request.objectives
        )
        return quiz
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Quiz generation failed: {str(e)}"
        )

