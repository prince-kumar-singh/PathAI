"""
Pydantic schemas for quiz generation
Ensures LangChain outputs match our quiz data structure exactly
"""
from pydantic import BaseModel, Field
from typing import List, Literal


class QuizQuestion(BaseModel):
    """Single MCQ question"""
    question: str = Field(description="The question text")
    options: List[str] = Field(
        description="4 answer options",
        min_length=4,
        max_length=4
    )
    correctAnswer: int = Field(
        description="Index of correct answer (0-3)",
        ge=0,
        le=3
    )
    topic: str = Field(description="Topic this question covers")


class QuizRequest(BaseModel):
    """Request to generate a quiz for a roadmap day"""
    career_domain: str = Field(description="Career domain (e.g., data_science_ai)")
    day_number: int = Field(description="Day number (1-10)", ge=1, le=10)
    day_title: str = Field(default="", description="Title of the day")
    topics: List[str] = Field(description="Key topics for this day")
    objectives: List[str] = Field(description="Learning objectives for this day")


class QuizResponse(BaseModel):
    """Response containing generated quiz questions"""
    career_domain: str
    day_number: int
    questions: List[QuizQuestion]
    total_questions: int = 5
