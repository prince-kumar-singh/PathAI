import requests
import json

url = "http://localhost:7000/api/v1/roadmaps/generate"
payload = {
    "career_domain": "Full Stack Developer",
    "skill_level": "beginner",
    "learning_style": "visual",
    "pace_preference": "standard"
}

print("Sending request...")
try:
    response = requests.post(url, json=payload, timeout=60)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Received roadmap with {len(data.get('days', []))} days")
        
        # Check resources structure
        errors = 0
        for day_idx, day in enumerate(data.get("days", [])):
            for task_idx, task in enumerate(day.get("tasks", [])):
                res = task.get("resources")
                if isinstance(res, str):
                    print(f"✗ Day {day_idx} Task {task_idx}: resources is STRING")
                    errors += 1
                elif isinstance(res, list):
                    for r_idx, r in enumerate(res):
                        if isinstance(r, str):
                            print(f"✗ Day {day_idx} Task {task_idx} Res {r_idx}: is STRING")
                            errors += 1
                            
        if errors == 0:
            print("✓ All resources are properly structured!")
        else:
            print(f"✗ Found {errors} string resources")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
