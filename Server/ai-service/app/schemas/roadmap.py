"""
Pydantic schemas for type-safe roadmap generation
Ensures LangChain outputs match our data structure exactly
"""
from pydantic import BaseModel, Field
from typing import List, Literal


class Resource(BaseModel):
    """Individual learning resource"""
    title: str = Field(description="Resource title")
    platform: str = Field(description="Platform (YouTube, Medium, etc.)")
    url_hint: str = Field(description="Search terms or specific URL hint")
    duration_minutes: int = Field(description="Estimated time in minutes")


class Task(BaseModel):
    """Learning task within a day"""
    task_id: str = Field(description="Unique task identifier (e.g., day1_task1)")
    title: str = Field(description="Task title")
    description: str = Field(description="What the learner should do")
    type: Literal["video", "article", "exercise", "project"] = Field(
        description="Task type - must be one of: video, article, exercise, project"
    )
    estimated_time_minutes: int = Field(description="Estimated completion time")
    resources: List[Resource] = Field(description="List of learning resources")


class Day(BaseModel):
    """Single day in the learning roadmap"""
    day_number: int = Field(description="Day number (1-10)")
    title: str = Field(description="Day theme/title")
    learning_objectives: List[str] = Field(
        description="3-5 learning objectives for the day"
    )
    key_topics: List[str] = Field(
        description="Key topics covered this day"
    )
    tasks: List[Task] = Field(description="3-4 tasks for the day")
    estimated_time_minutes: int = Field(description="Total time for the day")


class RoadmapSchema(BaseModel):
    """Complete 10-day learning roadmap"""
    career_domain: str = Field(description="Career path (e.g., Software Development)")
    skill_level: str = Field(description="Learner's skill level")
    total_days: int = Field(default=10, description="Total days in roadmap")
    days: List[Day] = Field(description="List of 10 days")
