"""
LangChain service for structured roadmap generation
Uses Pydantic output parser to guarantee type-safe responses
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from app.schemas.roadmap import RoadmapSchema
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RoadmapChain:
    """LangChain-based roadmap generator with structured output"""
    
    def __init__(self):
        logger.info("🔗 Initializing LangChain RoadmapChain...")
        
        # Import rate limiter
        from app.core.rate_limiter import rate_limiter
        self.rate_limiter = rate_limiter
        
        # Model will be selected dynamically based on quota
        self.current_model = None
        self.llm = None
        
        # Initialize Pydantic parser for type-safe output
        self.parser = PydanticOutputParser(pydantic_object=RoadmapSchema)
        
        # Create prompt template with format instructions
        self.prompt = self._create_prompt()
        
        logger.info("✅ RoadmapChain initialized (dynamic model selection)")
    
    def _create_prompt(self) -> PromptTemplate:
        """Create prompt template with Pydantic format instructions"""
        template = """You are an expert curriculum designer creating personalized learning roadmaps.

Create a comprehensive 10-day learning roadmap based on the learner's profile.

LEARNER PROFILE:
- Career Domain: {career_domain}
- Skill Level: {skill_level}
- Learning Style: {learning_style}
- Pace Preference: {pace_preference}

REQUIREMENTS:
1. Create exactly 10 days of learning content
2. Each day should have:
   - A clear theme/title
   - 3-5 specific learning objectives
   - 3-4 hands-on tasks (mix of videos, articles, exercises, projects)
   - 60-90 minutes total time
   - Progressive difficulty building on previous days

3. Task types MUST be one of: "video", "article", "exercise", or "project"
   - Use "article" for reading/tutorials (NOT "reading")
   - Use "exercise" for coding practice (NOT "coding_exercise")
   - Use "project" for hands-on projects
   - Use "video" for video content

4. Resources should be:
   - Specific and actionable
   - Include search hints for finding content
   - Realistic duration estimates

5. Design for {learning_style} learners:
   - Visual: Include diagrams, videos, visual explanations
   - Auditory: Include podcasts, video lectures, discussions
   - Kinesthetic: Include hands-on exercises, coding challenges, projects
   - Reading/Writing: Include articles, documentation, written exercises

OUTPUT FORMAT:
{format_instructions}

Generate the roadmap now:"""
        
        return PromptTemplate(
            template=template,
            input_variables=["career_domain", "skill_level", "learning_style", "pace_preference"],
            partial_variables={
                "format_instructions": self.parser.get_format_instructions()
            }
        )
    
    async def generate(self, profile: dict) -> RoadmapSchema:
        """
        Generate type-safe roadmap using LangChain with smart rate limiting
        
        Args:
            profile: Dict with career_domain, skill_level, learning_style, pace_preference
            
        Returns:
            RoadmapSchema: Validated Pydantic model
            
        Raises:
            ValidationError: If LLM output doesn't match schema
            Exception: If all models at quota limit
        """
        logger.info(f"🚀 Generating roadmap for {profile.get('career_domain')} - {profile.get('skill_level')}")
        
        try:
            # Select best available model based on quota
            model_name = await self.rate_limiter.select_model(estimated_tokens=4000)
            
            if model_name is None:
                # All models exhausted - wait for quota
                logger.warning("⏳ All models at limit, waiting for quota...")
                model_name = await self.rate_limiter.wait_for_quota(max_wait=60)
                
                if model_name is None:
                    raise Exception("All Gemini models at quota limit. Please try again later.")
            
            # Initialize LLM with selected model
            logger.info(f"🤖 Using model: {model_name}")
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.7
            )
            
            # Build chain dynamically
            chain = self.prompt | llm | self.parser
            
            # Invoke the chain - LangChain handles everything
            roadmap = await chain.ainvoke(profile)
            
            # Record usage for rate limiting
            # Estimate tokens used (roadmap generation typically uses 3000-5000 tokens)
            self.rate_limiter.record_usage(model_name, tokens_used=4000)
            
            logger.info(f"✅ Roadmap generated successfully: {len(roadmap.days)} days")
            logger.info(f"   Total tasks: {sum(len(day.tasks) for day in roadmap.days)}")
            logger.info(f"   Model used: {model_name}")
            
            return roadmap
            
        except Exception as e:
            logger.error(f"❌ LangChain generation failed: {e}")
            raise

