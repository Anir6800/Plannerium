import json
import google.generativeai as genai
from datetime import datetime, timedelta
from typing import Dict, List, Any

def validate_json_response(response_text: str) -> Dict[str, Any]:
    """Validate and parse JSON response from Gemini."""
    try:
        # Try to extract JSON from the response
        # Sometimes Gemini wraps JSON in markdown
        if '```json' in response_text:
            start = response_text.find('```json') + 7
            end = response_text.find('```', start)
            json_str = response_text[start:end].strip()
        elif '```' in response_text:
            start = response_text.find('```') + 3
            end = response_text.find('```', start)
            json_str = response_text[start:end].strip()
        else:
            json_str = response_text.strip()
        
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}")

def decomposition_agent(goal: str, start_date: str, deadline: str, hours_per_week: int, model) -> Dict[str, Any]:
    """
    Agent 1: Break down the goal into milestones, tasks, estimated hours, and dependencies.
    """
    prompt = f"""You are a project decomposition expert. Break down the following goal into a structured project plan.

Goal: {goal}
Start Date: {start_date}
Deadline: {deadline}
Available Hours per Week: {hours_per_week}

Return a JSON object with this exact structure:
{{
  "tasks": [
    {{
      "id": "task_1",
      "title": "Task name",
      "description": "Detailed description",
      "milestone": "Milestone name",
      "estimated_hours": 8,
      "dependencies": [],
      "deliverable": "What will be delivered"
    }}
  ],
  "milestones": [
    {{
      "name": "Milestone name",
      "description": "Milestone description",
      "target_date": "YYYY-MM-DD"
    }}
  ]
}}

Requirements:
- Create 8-15 tasks that comprehensively cover the goal
- Each task should be specific and actionable
- Include realistic time estimates (total should fit within the timeline)
- Identify dependencies between tasks
- Group tasks into logical milestones
- Ensure tasks can be completed by one person working {hours_per_week} hours per week"""

    response = model.generate_content(prompt)
    return validate_json_response(response.text)

def prioritization_agent(tasks: List[Dict[str, Any]], model) -> List[Dict[str, Any]]:
    """
    Agent 2: Score each task based on impact, urgency, and effort. Assign priority labels.
    """
    tasks_json = json.dumps(tasks, indent=2)
    
    prompt = f"""You are a task prioritization expert. Analyze these tasks and assign priority scores.

Tasks:
{tasks_json}

For each task, evaluate:
1. Impact (1-10): How much this task contributes to the overall goal
2. Urgency (1-10): How time-sensitive this task is
3. Effort (1-10): How much work this task requires (higher = more effort)

Return the tasks with added priority fields:
{{
  "tasks": [
    {{
      "id": "task_1",
      "title": "Task name",
      "description": "Task description",
      "milestone": "Milestone name", 
      "estimated_hours": 8,
      "dependencies": [],
      "deliverable": "What will be delivered",
      "impact_score": 8,
      "urgency_score": 7,
      "effort_score": 6,
      "priority_score": 21,
      "priority_label": "High"
    }}
  ]
}}

Priority Score = Impact + Urgency + (10 - Effort)
Priority Labels:
- High: Score 22-30
- Medium: Score 15-21  
- Low: Score 3-14

Keep all original task fields and add the new priority fields."""

    response = model.generate_content(prompt)
    result = validate_json_response(response.text)
    return result.get('tasks', [])

def scheduling_agent(tasks: List[Dict[str, Any]], start_date: str, deadline: str, hours_per_week: int, model) -> List[Dict[str, Any]]:
    """
    Agent 3: Create week-by-week schedule respecting available hours and dependencies.
    """
    tasks_json = json.dumps(tasks, indent=2)
    
    prompt = f"""You are a project scheduling expert. Create a week-by-week schedule for these tasks.

Tasks:
{tasks_json}
Start Date: {start_date}
Deadline: {deadline}
Available Hours per Week: {hours_per_week}

Create a schedule that:
1. Respects task dependencies
2. Doesn't exceed {hours_per_week} hours per week
3. Spreads work evenly across weeks
4. Meets the deadline

Return a JSON object:
{{
  "schedule": [
    {{
      "week_start": "YYYY-MM-DD",
      "week_number": 1,
      "hours_planned": 15,
      "tasks": [
        {{
          "task_id": "task_1",
          "task_title": "Task name",
          "hours_assigned": 8,
          "milestone": "Milestone name"
        }}
      ]
    }}
  ]
}}

Schedule Requirements:
- Create weekly entries from start date to deadline
- Assign specific hours to specific tasks each week
- Ensure no week exceeds {hours_per_week} hours
- Respect task dependencies (don't schedule dependent tasks before prerequisites)
- Include week numbers and dates"""

    response = model.generate_content(prompt)
    result = validate_json_response(response.text)
    return result.get('schedule', [])

def risk_analysis_agent(tasks: List[Dict[str, Any]], schedule: List[Dict[str, Any]], model) -> List[Dict[str, Any]]:
    """
    Agent 4: Identify top risks with severity levels and mitigation strategies.
    """
    tasks_json = json.dumps(tasks, indent=2)
    schedule_json = json.dumps(schedule, indent=2)
    
    prompt = f"""You are a risk analysis expert. Identify potential risks for this project.

Tasks:
{tasks_json}
Schedule:
{schedule_json}

Identify 5-8 specific risks that could impact this project. For each risk, provide:
- Risk description
- Probability (High/Medium/Low)
- Impact (High/Medium/Low)
- Severity (High/Medium/Low based on probability + impact)
- Mitigation strategy

Return a JSON object:
{{
  "risks": [
    {{
      "id": "risk_1",
      "description": "Technical complexity may cause delays",
      "probability": "Medium",
      "impact": "High",
      "severity": "High",
      "mitigation": "Break down complex tasks earlier, allocate buffer time"
    }}
  ]
}}

Focus on realistic, specific risks that could actually occur during project execution."""

    response = model.generate_content(prompt)
    result = validate_json_response(response.text)
    return result.get('risks', [])

def optimization_agent(tasks: List[Dict[str, Any]], schedule: List[Dict[str, Any]], risks: List[Dict[str, Any]], model) -> List[Dict[str, Any]]:
    """
    Agent 5: Suggest optimizations for scope, timeline, and task organization.
    """
    tasks_json = json.dumps(tasks, indent=2)
    schedule_json = json.dumps(schedule, indent=2)
    risks_json = json.dumps(risks, indent=2)
    
    prompt = f"""You are a project optimization expert. Analyze this project and suggest improvements.

Tasks:
{tasks_json}
Schedule:
{schedule_json}
Risks:
{risks_json}

Provide specific, actionable optimizations in these categories:
1. Scope Reduction - Ways to simplify or reduce project scope
2. Timeline Adjustment - Ways to optimize the schedule
3. Task Reordering - Better ways to sequence tasks
4. Task Compression - Ways to combine or streamline tasks
5. Resource Optimization - Better use of available hours

Return a JSON object:
{{
  "optimizations": [
    {{
      "category": "Scope Reduction",
      "title": "Simplify authentication system",
      "description": "Instead of building custom auth, use a third-party service",
      "impact": "Saves 16 hours, reduces risk",
      "priority": "High"
    }}
  ]
}}

Provide 8-12 specific optimizations that would meaningfully improve the project plan."""

    response = model.generate_content(prompt)
    result = validate_json_response(response.text)
    return result.get('optimizations', [])

def run_planning_pipeline(goal: str, start_date: str, deadline: str, hours_per_week: int, model) -> Dict[str, Any]:
    """
    Run the complete 5-agent planning pipeline.
    """
    try:
        # Agent 1: Decomposition
        decomposition_result = decomposition_agent(goal, start_date, deadline, hours_per_week, model)
        tasks = decomposition_result.get('tasks', [])
        
        # Agent 2: Prioritization
        prioritized_tasks = prioritization_agent(tasks, model)
        
        # Agent 3: Scheduling
        schedule = scheduling_agent(prioritized_tasks, start_date, deadline, hours_per_week, model)
        
        # Agent 4: Risk Analysis
        risks = risk_analysis_agent(prioritized_tasks, schedule, model)
        
        # Agent 5: Optimization
        optimizations = optimization_agent(prioritized_tasks, schedule, risks, model)
        
        # Compile final result
        result = {
            'goal': goal,
            'start_date': start_date,
            'deadline': deadline,
            'hours_per_week': hours_per_week,
            'tasks': prioritized_tasks,
            'schedule': schedule,
            'risks': risks,
            'optimizations': optimizations,
            'generated_at': datetime.now().isoformat()
        }
        
        return result
    
    except Exception as e:
        raise ValueError(f"Planning pipeline failed: {str(e)}")