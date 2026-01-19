"""
LangChain prompt template for quiz question generation
Generates 5 MCQ questions based on roadmap day topics
"""

GENERATE_QUIZ_PROMPT = """
You are an expert educator creating assessment questions for a learning roadmap.

**Context:**
- Career Domain: {career_domain}
- Day Number: {day_number} of 10
- Day Title: {day_title}
- Key Topics: {topics}
- Learning Objectives: {objectives}

**Task:**
Generate exactly 5 multiple-choice questions (MCQs) that assess the learner's understanding of the day's content.

**Requirements:**
1. Each question must directly relate to one of the key topics or learning objectives
2. Questions should be at beginner-to-intermediate difficulty
3. Each question must have exactly 4 options (A, B, C, D)
4. Only ONE option should be correct
5. Distractors (wrong answers) should be plausible but clearly incorrect
6. Questions should progress from easier to harder

**CRITICAL JSON FORMATTING RULES:**
1. Return ONLY valid JSON, no markdown or explanations
2. "questions" MUST be an array of exactly 5 question objects
3. "options" MUST be an array of exactly 4 strings
4. "correctAnswer" MUST be an integer 0-3 (index of correct option)
5. Ensure proper JSON syntax with no trailing commas

**Output Format:**
{{
    "questions": [
        {{
            "question": "What is the primary purpose of X?",
            "options": [
                "Option A text",
                "Option B text", 
                "Option C text",
                "Option D text"
            ],
            "correctAnswer": 0,
            "topic": "Topic name"
        }},
        // ... 4 more questions
    ]
}}

Generate the 5 quiz questions now:
"""


def format_quiz_prompt(
    career_domain: str,
    day_number: int,
    day_title: str,
    topics: list,
    objectives: list
) -> str:
    """Format the quiz generation prompt with provided values"""
    return GENERATE_QUIZ_PROMPT.format(
        career_domain=career_domain,
        day_number=day_number,
        day_title=day_title,
        topics=", ".join(topics) if topics else "General concepts",
        objectives=", ".join(objectives) if objectives else "Understand core concepts"
    )
