"""
Production-Ready Roadmap Generator using LangChain with Native JSON Schema
Based on official LangChain documentation: https://python.langchain.com/docs/integrations/chat/google_generative_ai/
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
from typing import List, Literal
from app.core.config import settings
from app.core.rate_limiter import rate_limiter
import logging

logger = logging.getLogger(__name__)


# Pydantic models for type-safe schema definition
class Resource(BaseModel):
    """Single learning resource"""
    title: str = Field(description="Title of the resource")
    platform: str = Field(description="Platform name (YouTube, Medium, etc.)")
    url_hint: str = Field(description="Search hint or specific URL")
    duration_minutes: int = Field(description="Estimated duration in minutes")


class Task(BaseModel):
    """Single learning task"""
    task_id: str = Field(description="Unique ID for the task")
    title: str = Field(description="Task title")
    description: str = Field(description="Detailed task description")
    type: Literal["video", "article", "exercise", "project"] = Field(
        description="Task type: video, article, exercise, or project"
    )
    estimated_time_minutes: int = Field(description="Estimated completion time")
    resources: List[Resource] = Field(description="List of learning resources")


class Day(BaseModel):
    """Single day in the roadmap"""
    day_number: int = Field(description="Day number (1-10)")
    title: str = Field(description="Day title/theme")
    learning_objectives: List[str] = Field(description="List of learning objectives")
    key_topics: List[str] = Field(description="List of key topics")
    tasks: List[Task] = Field(description="List of tasks for the day")
    estimated_time_minutes: int = Field(description="Total estimated time for the day")


class RoadmapSchema(BaseModel):
    """Complete 10-day learning roadmap"""
    career_domain: str = Field(description="Career domain/tech stack")
    skill_level: str = Field(description="Skill level (beginner/intermediate/advanced)")
    total_days: int = Field(description="Total number of days (should be 10)")
    days: List[Day] = Field(description="List of 10 days")
    status: str = Field(default="generated", description="Generation status")


class RoadmapGeneratorV2:
    """Production-ready roadmap generator using LangChain's native structure output"""
    
    def __init__(self):
        logger.info("🔗 Initializing RoadmapGeneratorV2 with LangChain...")
        self.rate_limiter = rate_limiter
        
    def _create_llm(self, model_name: str) -> ChatGoogleGenerativeAI:
        """Create LangChain model instance"""
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7
        )
    
    def _create_prompt(self, career_domain: str, skill_level: str, learning_style: str, pace_preference: str) -> str:
        """Create detailed prompt"""
        return f"""You are an expert curriculum designer creating personalized learning roadmaps.

Create a comprehensive 10-day learning roadmap for:
- Career Domain: {career_domain}
- Skill Level: {skill_level}
- Learning Style: {learning_style}
- Pace Preference: {pace_preference}

CRITICAL REQUIREMENTS:
1. Create EXACTLY 10 days of progressive learning content
2. Each day MUST have:
   - Clear theme/title
   - 3-5 specific, measurable learning objectives
   - 3-4 hands-on tasks
   - 60-90 minutes total time
   - Progressive difficulty building on previous days

3. Task types MUST be ONLY ONE OF: "video", "article", "exercise", or "project"
   - video: Video tutorials, lectures
   - article: Blog posts, documentation, tutorials 
   - exercise: Coding challenges, practice problems
   - project: Hands-on projects, implementations

4. Each resource MUST include:
   - Specific title (not generic)
   - Platform name (YouTube, freeCodeCamp, MDN, etc.)
   - Search hint
   - Realistic duration estimate

5. Design for {learning_style} learners:
   - Visual: Include diagrams, videos
   - Auditory: Include video lectures, podcasts
   - Kinesthetic: Include hands-on exercises, projects
   - Reading/Writing: Include articles, documentation

6. Logical progression:
   - Days 1-2: Fundamentals and setup
   - Days 3-5: Core concepts and practice
   - Days 6-8: Advanced topics
   - Days 9-10: Integration and cap stone project

Generate the complete 10-day roadmap now in the required JSON format."""
    
    async def generate_roadmap(
        self,
        career_domain: str,
        skill_level: str,
        learning_style: str,
        pace_preference: str = "standard"
    ) -> dict:
        """
        Generate roadmap with LangChain's native structured output
        
        Returns:
            dict: Validated roadmap data
        """
        logger.info(f"🚀 Generating roadmap: {career_domain} ({skill_level})")
        
        try:
            # Select model based on quota
            model_name = await self.rate_limiter.select_model(estimated_tokens=5000)
            
            if model_name is None:
                logger.warning("⏳ All models at limit, waiting...")
                model_name = await self.rate_limiter.wait_for_quota(max_wait=60)
                
                if model_name is None:
                    raise Exception("All Gemini models at quota limit. Please try again later.")
            
            logger.info(f"🤖 Selected model: {model_name}")
            
            # Create LLM with selected model
            llm = self._create_llm(model_name)
            
            # Use LangChain's with_structured_output with json_schema method
            # This uses Gemini's native structured output - NOT function calling
            structured_llm = llm.with_structured_output(
                schema=RoadmapSchema.model_json_schema(),
                method="json_schema"  # Uses native Gemini JSON schema enforcement
            )
            
            # Create prompt
            prompt = self._create_prompt(career_domain, skill_level, learning_style, pace_preference)
            
            # Generate with schema enforcement
            logger.info("📝 Invoking LangChain with structured output...")
            roadmap = await structured_llm.ainvoke(prompt)
            
            # Record usage
            self.rate_limiter.record_usage(model_name, tokens_used=5000)
            
            # Convert Pydantic model to dict
            if isinstance(roadmap, dict):
                roadmap_data = roadmap
            else:
                roadmap_data = roadmap if isinstance(roadmap, dict) else dict(roadmap)
            
            # Enrich resources with real URLs using DuckDuckGo search
            logger.info("🔎 Finding real URLs for resources...")
            try:
                from app.services.resource_url_finder import resource_url_finder
                roadmap_data = await resource_url_finder.enrich_resources(roadmap_data)
            except Exception as url_error:
                logger.warning(f"⚠️ URL enrichment failed (continuing without): {url_error}")
            
            logger.info(f"✅ Roadmap generated successfully")
            logger.info(f"   Model: {model_name}")
            logger.info(f"   Days: {len(roadmap_data.get('days', []))}")
            logger.info(f"   Tasks: {sum(len(day.get('tasks', [])) for day in roadmap_data.get('days', []))}")
            
            return roadmap_data
            
        except Exception as e:
            logger.error(f"❌ Generation failed: {e}", exc_info=True)
            raise


# Singleton instance
roadmap_generator_v2 = RoadmapGeneratorV2()
