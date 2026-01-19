"""
Quiz generator service using LangChain + Gemini
Generates 5 MCQ questions for roadmap day assessment
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from app.schemas.quiz import QuizQuestion, QuizResponse
from app.services.quiz_prompts import GENERATE_QUIZ_PROMPT
from app.core.config import settings
from typing import List
import logging
import json

logger = logging.getLogger(__name__)


class QuizGenerator:
    """LangChain-based quiz generator with structured JSON output"""
    
    def __init__(self):
        logger.info("🎯 Initializing QuizGenerator...")
        
        # JSON output parser for quiz format
        self.parser = JsonOutputParser()
        
        # Create prompt template
        self.prompt = PromptTemplate(
            template=GENERATE_QUIZ_PROMPT,
            input_variables=["career_domain", "day_number", "day_title", "topics", "objectives"]
        )
        
        logger.info("✅ QuizGenerator initialized")
    
    async def generate_quiz(
        self,
        career_domain: str,
        day_number: int,
        day_title: str = "",
        topics: List[str] = None,
        objectives: List[str] = None,
        max_retries: int = 3
    ) -> QuizResponse:
        """
        Generate 5 MCQ questions for a roadmap day
        
        Args:
            career_domain: Career path (e.g., "data_science_ai")
            day_number: Day number (1-10)
            day_title: Title of the day
            topics: Key topics for this day
            objectives: Learning objectives
            max_retries: Number of retry attempts on failure
            
        Returns:
            QuizResponse: Validated quiz with 5 questions
            
        Raises:
            Exception: If generation fails after all retries
        """
        topics = topics or ["General concepts"]
        objectives = objectives or ["Understand core concepts"]
        
        logger.info(f"🎯 Generating quiz for {career_domain} - Day {day_number}")
        logger.info(f"   Topics: {topics[:3]}...")
        
        # Import rate limiter for model selection
        from app.core.rate_limiter import rate_limiter
        
        last_error = None
        
        for attempt in range(max_retries):
            try:
                # Select available model
                model_name = await rate_limiter.select_model(estimated_tokens=1500)
                
                if model_name is None:
                    model_name = await rate_limiter.wait_for_quota(max_wait=30)
                    if model_name is None:
                        raise Exception("All Gemini models at quota limit")
                
                logger.info(f"🤖 Attempt {attempt + 1}/{max_retries} using model: {model_name}")
                
                # Initialize LLM
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=settings.GEMINI_API_KEY,
                    temperature=0.7
                )
                
                # Build and invoke chain
                chain = self.prompt | llm | self.parser
                
                result = await chain.ainvoke({
                    "career_domain": career_domain,
                    "day_number": day_number,
                    "day_title": day_title or f"Day {day_number}",
                    "topics": ", ".join(topics),
                    "objectives": "\n".join(f"- {obj}" for obj in objectives)
                })
                
                # Record usage
                rate_limiter.record_usage(model_name, tokens_used=1500)
                
                # Validate and parse questions
                questions = self._parse_questions(result)
                
                logger.info(f"✅ Quiz generated successfully: {len(questions)} questions")
                
                return QuizResponse(
                    career_domain=career_domain,
                    day_number=day_number,
                    questions=questions,
                    total_questions=len(questions)
                )
                
            except Exception as e:
                last_error = e
                logger.warning(f"⚠️ Attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    logger.info("🔄 Retrying...")
                    continue
        
        logger.error(f"❌ Quiz generation failed after {max_retries} attempts: {last_error}")
        raise Exception(f"Quiz generation failed: {last_error}")
    
    def _parse_questions(self, raw_result: dict) -> List[QuizQuestion]:
        """Parse and validate quiz questions from LLM output"""
        questions_data = raw_result.get("questions", [])
        
        if not questions_data or len(questions_data) < 5:
            raise ValueError(f"Expected 5 questions, got {len(questions_data)}")
        
        questions = []
        for i, q in enumerate(questions_data[:5]):  # Limit to 5 questions
            # Validate question structure
            if not isinstance(q.get("options"), list) or len(q["options"]) != 4:
                raise ValueError(f"Question {i+1} must have exactly 4 options")
            
            correct_answer = q.get("correctAnswer", 0)
            if not isinstance(correct_answer, int) or correct_answer < 0 or correct_answer > 3:
                correct_answer = 0  # Default to first option if invalid
            
            questions.append(QuizQuestion(
                question=q.get("question", f"Question {i+1}"),
                options=q["options"],
                correctAnswer=correct_answer,
                topic=q.get("topic", "General")
            ))
        
        return questions


# Singleton instance
quiz_generator = QuizGenerator()
