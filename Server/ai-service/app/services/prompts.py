"""
LangChain prompt templates for PathAI roadmap generation
5-step prompt chain for personalized learning roadmap creation
"""

# Chain 1: Analyze Career Domain & Skill Level
ANALYZE_CAREER_PROMPT = """
You are an expert career advisor and curriculum designer. Analyze the following learner profile and provide insights.

**Learner Profile:**
- Career Domain: {career_domain}
- Skill Level: {skill_level}
- Learning Style: {learning_style}
- Pace Preference: {pace_preference}

**Task:**
Analyze this profile and provide:
1. Key skill areas needed for this career
2. Recommended learning path structure
3. Estimated difficulty level for a {skill_level} learner
4. Suggested focus areas

Return your analysis in JSON format:
{{
    "skill_areas": ["skill1", "skill2", ...],
    "learning_path_structure": "description",
    "difficulty_assessment": "easy/moderate/challenging",
    "focus_areas": ["area1", "area2", ...],
    "prerequisites": ["prereq1", "prereq2", ...]
}}
"""

# Chain 2: Generate Learning Objectives Per Day
GENERATE_OBJECTIVES_PROMPT = """
You are creating a 10-day intensive learning roadmap for: {career_domain}

**Learner Context:**
- Skill Level: {skill_level}
- Focus Areas: {focus_areas}
- Learning Style: {learning_style}

**Task:**
Generate learning objectives for Day {day_number} of 10. Each day should:
- Build progressively on previous days
- Include 3-5 specific learning objectives
- Cover key topics for the day
- Be achievable in 60-90 minutes

**Day {day_number} Theme:** {day_theme}

Return in JSON format:
{{
    "day_number": {day_number},
    "title": "Concise day title",
    "learning_objectives": [
        "Specific objective 1",
        "Specific objective 2",
        "Specific objective 3"
    ],
    "key_topics": ["topic1", "topic2", "topic3"],
    "estimated_time_minutes": 90
}}
"""

# Chain 3: Generate Daily Tasks
GENERATE_TASKS_PROMPT = """
You are designing hands-on learning tasks for a {career_domain} roadmap.

**Day Context:**
- Day {day_number}: {day_title}
- Learning Objectives: {learning_objectives}
- Skill Level: {skill_level}

**Task:**
Create 3-4 specific tasks for this day. Each task should:
- Directly support the learning objectives
- Be hands-on and practical
- Include clear deliverables
- Build real-world skills

Mix task types:
- Video lessons (20-30 min)
- Reading/Articles (15-20 min)
- Hands-on exercises/coding (30-40 min)

Return in JSON format:
{{
    "tasks": [
        {{
            "task_id": "day{day_number}_task1",
            "title": "Task title",
            "description": "Clear description of what to do",
            "type": "video|article|exercise",
            "estimated_time_minutes": 25,
            "difficulty": "easy|medium|hard"
        }}
    ]
}}
"""

# Chain 4: Curate Resources
CURATE_RESOURCES_PROMPT = """
You are a resource curator for online learning.

**Task Context:**
- Career Domain: {career_domain}
- Task: {task_title}
- Task Type: {task_type}
- Skill Level: {skill_level}
- Topics: {topics}

**Task:**
Suggest 2-3 high-quality learning resources for this task. Prioritize:
1. Free or freemium resources
2. Well-known platforms (YouTube, Medium, FreeCodeCamp, etc.)
3. Recent content (last 2-3 years)
4. High engagement (views, likes, ratings)

For video resources, suggest specific video titles or channel names.
For articles, suggest blog topics or tutorial names.
For exercises, suggest platforms like LeetCode, HackerRank, or project ideas.

Return in JSON format:
{{
    "resources": [
        {{
            "resource_id": "unique_id",
            "type": "video|article|exercise",
            "title": "Specific title or search query",
            "platform": "YouTube|Medium|FreeCodeCamp|etc",
            "url_hint": "channel or search terms",
            "duration_minutes": 25,
            "difficulty": "beginner|intermediate|advanced",
            "why_recommended": "Brief explanation"
        }}
    ]
}}
"""

# Chain 5: Validate & Polish
VALIDATE_ROADMAP_PROMPT = """
You are a quality assurance expert for learning content.

**Roadmap to Validate:**
{roadmap_json}

**Validation Criteria:**
1. **Completeness:** All 10 days have content
2. **Progression:** Each day builds on previous days
3. **Balance:** Mix of theory and practice
4. **Time:** Each day is 60-90 minutes
5. **Clarity:** Objectives are clear and specific
6. **Relevance:** Content matches {career_domain}

**Task:**
1. Check the roadmap against all criteria
2. Identify any issues or gaps
3. Suggest improvements
4. Calculate quality score (0-100)

Return in JSON format:
{{
    "quality_score": 85,
    "completeness_check": true,
    "progression_check": true,
    "balance_check": true,
    "time_check": true,
    "issues": ["issue1", "issue2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "overall_assessment": "Brief assessment"
}}
"""

# Master Roadmap Generation Prompt (All-in-one alternative)
GENERATE_FULL_ROADMAP_PROMPT = """
You are an expert curriculum designer creating a personalized 10-day learning roadmap.

**Learner Profile:**
- Career Domain: {career_domain}
- Current Skill Level: {skill_level}
- Learning Style: {learning_style}
- Pace: {pace_preference}

**Requirements:**
Create a comprehensive 10-day roadmap where each day:
- Has a clear theme and title
- Contains 3-5 specific learning objectives
- Includes 3-4 hands-on tasks (video, reading, exercise)
- Takes 60-90 minutes to complete
- Builds progressively on previous days

**CRITICAL JSON FORMATTING RULES:**
1. ALL arrays MUST be proper JSON arrays, NOT stringified JSON strings
2. "learning_objectives" MUST be an array of strings: ["obj1", "obj2"]
3. "key_topics" MUST be an array of strings: ["topic1", "topic2"]
4. "resources" MUST be an array of objects: [{{"title": "...", "platform": "..."}}]
5. DO NOT wrap arrays in quotes or stringify them
6. Ensure proper JSON syntax with no trailing commas
7. **TASK TYPE** must be ONLY one of: "video", "article", "exercise", or "project"
   - Use "article" for reading/tutorials (NOT "reading")
   - Use "exercise" for coding practice (NOT "coding_exercise")
   - Use "project" for hands-on projects
   - Use "video" for video content

INCORRECT: "resources": "[{\"title\": \"Resource\"}]"  ❌
CORRECT: "resources": [{{"title": "Resource"}}]  ✅

INCORRECT: "type": "reading"  ❌
CORRECT: "type": "article"  ✅

**Output Format:**
Return a complete JSON roadmap with this structure:
{{
    "career_domain": "{career_domain}",
    "skill_level": "{skill_level}",
    "total_days": 10,
    "days": [
        {{
            "day_number": 1,
            "title": "Day title",
            "learning_objectives": ["objective1", "objective2", "objective3"],
            "key_topics": ["topic1", "topic2"],
            "tasks": [
                {{
                    "task_id": "day1_task1",
                    "title": "Task title",
                    "description": "What to do",
                    "type": "article",
                    "estimated_time_minutes": 25,
                    "resources": [
                        {{
                            "title": "Resource title",
                            "platform": "YouTube",
                            "url_hint": "search terms or channel",
                            "duration_minutes": 20
                        }}
                    ]
                }}
            ],
            "estimated_time_minutes": 90
        }}
    ]
}}

**Day Themes (Suggested):**
Day 1: Foundations and Core Concepts
Day 2: Essential Tools and Setup
Day 3: First Practical Application
Day 4: Intermediate Techniques
Day 5: Mid-Point Project
Day 6: Advanced Concepts
Day 7: Real-World Patterns
Day 8: Integration and Best Practices
Day 9: Capstone Project Start
Day 10: Capstone Completion & Next Steps

Generate the complete roadmap now. Remember: NO stringified arrays!
"""

# Helper function to format prompts
def format_prompt(template: str, **kwargs) -> str:
    """Format a prompt template with provided values"""
    return template.format(**kwargs)
