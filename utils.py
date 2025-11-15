import json
import os
import csv
import io
from datetime import datetime
from typing import Dict, List, Any
import pandas as pd
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

def save_project_to_file(project_name: str, project_data: Dict[str, Any]) -> bool:
    """Save project data to a JSON file."""
    try:
        filename = f"storage/{project_name}.json"
        os.makedirs('storage', exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"Error saving project: {e}")
        return False

def load_project_from_file(project_name: str) -> Dict[str, Any]:
    """Load project data from a JSON file."""
    try:
        filename = f"storage/{project_name}.json"
        
        if not os.path.exists(filename):
            return None
        
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    except Exception as e:
        print(f"Error loading project: {e}")
        return None

def generate_csv(project_data: Dict[str, Any]) -> str:
    """Generate CSV content from project schedule."""
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Week Start', 'Week Number', 'Task Title', 'Milestone', 'Hours Assigned'])
        
        # Write schedule data
        schedule = project_data.get('schedule', [])
        for week in schedule:
            week_start = week.get('week_start', '')
            week_number = week.get('week_number', '')
            
            for task in week.get('tasks', []):
                writer.writerow([
                    week_start,
                    week_number,
                    task.get('task_title', ''),
                    task.get('milestone', ''),
                    task.get('hours_assigned', 0)
                ])
        
        return output.getvalue()
    
    except Exception as e:
        print(f"Error generating CSV: {e}")
        return ""

def generate_pdf(project_data: Dict[str, Any]) -> bytes:
    """Generate PDF content from project data."""
    try:
        # Create HTML content for PDF
        html_content = create_pdf_html(project_data)
        
        # Configure fonts
        font_config = FontConfiguration()
        
        # Generate PDF
        pdf_bytes = HTML(string=html_content).write_pdf(
            font_config=font_config
        )
        
        return pdf_bytes
    
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return b""

def create_pdf_html(project_data: Dict[str, Any]) -> str:
    """Create HTML content for PDF generation."""
    project_name = project_data.get('project_name', 'Project Plan')
    goal = project_data.get('goal', 'No goal specified')
    start_date = project_data.get('start_date', '')
    deadline = project_data.get('deadline', '')
    hours_per_week = project_data.get('hours_per_week', 0)
    
    tasks = project_data.get('tasks', [])
    schedule = project_data.get('schedule', [])
    risks = project_data.get('risks', [])
    optimizations = project_data.get('optimizations', [])
    
    # Generate task table
    task_rows = ""
    for task in tasks:
        priority_color = {
            'High': '#dc3545',
            'Medium': '#ffc107', 
            'Low': '#28a745'
        }.get(task.get('priority_label', 'Medium'), '#6c757d')
        
        task_rows += f"""
        <tr>
            <td>{task.get('title', '')}</td>
            <td>{task.get('milestone', '')}</td>
            <td>{task.get('estimated_hours', 0)}</td>
            <td><span style="color: {priority_color}; font-weight: bold;">{task.get('priority_label', '')}</span></td>
            <td>{', '.join(task.get('dependencies', []))}</td>
        </tr>
        """
    
    # Generate schedule table
    schedule_rows = ""
    for week in schedule:
        for task in week.get('tasks', []):
            schedule_rows += f"""
            <tr>
                <td>{week.get('week_start', '')}</td>
                <td>Week {week.get('week_number', '')}</td>
                <td>{task.get('task_title', '')}</td>
                <td>{task.get('milestone', '')}</td>
                <td>{task.get('hours_assigned', 0)}</td>
            </tr>
            """
    
    # Generate risk table
    risk_rows = ""
    for risk in risks:
        severity_color = {
            'High': '#dc3545',
            'Medium': '#ffc107',
            'Low': '#28a745'
        }.get(risk.get('severity', 'Medium'), '#6c757d')
        
        risk_rows += f"""
        <tr>
            <td>{risk.get('description', '')}</td>
            <td>{risk.get('probability', '')}</td>
            <td>{risk.get('impact', '')}</td>
            <td><span style="color: {severity_color}; font-weight: bold;">{risk.get('severity', '')}</span></td>
            <td>{risk.get('mitigation', '')}</td>
        </tr>
        """
    
    # Generate optimization list
    optimization_items = ""
    for opt in optimizations:
        optimization_items += f"""
        <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
            <strong>{opt.get('title', '')}</strong> ({opt.get('category', '')})
            <br>
            {opt.get('description', '')}
            <br>
            <em>Impact: {opt.get('impact', '')}</em>
        </div>
        """
    
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{project_name} - Project Plan</title>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #007bff;
            }}
            .header h1 {{
                color: #007bff;
                margin: 0;
            }}
            .project-info {{
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 30px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 12px;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }}
            th {{
                background-color: #007bff;
                color: white;
                font-weight: bold;
            }}
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            .section {{
                margin-bottom: 40px;
            }}
            .section h2 {{
                color: #007bff;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
            }}
            .footer {{
                text-align: center;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{project_name}</h1>
            <p>Comprehensive Project Plan</p>
        </div>
        
        <div class="project-info">
            <h3>Project Overview</h3>
            <p><strong>Goal:</strong> {goal}</p>
            <p><strong>Start Date:</strong> {start_date}</p>
            <p><strong>Deadline:</strong> {deadline}</p>
            <p><strong>Hours per Week:</strong> {hours_per_week}</p>
            <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
        </div>
        
        <div class="section">
            <h2>Tasks & Milestones</h2>
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Milestone</th>
                        <th>Estimated Hours</th>
                        <th>Priority</th>
                        <th>Dependencies</th>
                    </tr>
                </thead>
                <tbody>
                    {task_rows}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Weekly Schedule</h2>
            <table>
                <thead>
                    <tr>
                        <th>Week Start</th>
                        <th>Week</th>
                        <th>Task</th>
                        <th>Milestone</th>
                        <th>Hours Assigned</th>
                    </tr>
                </thead>
                <tbody>
                    {schedule_rows}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Risk Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Risk Description</th>
                        <th>Probability</th>
                        <th>Impact</th>
                        <th>Severity</th>
                        <th>Mitigation Strategy</th>
                    </tr>
                </thead>
                <tbody>
                    {risk_rows}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Optimization Suggestions</h2>
            {optimization_items}
        </div>
        
        <div class="footer">
            <p>Generated by Plannerium - Intelligent Multi-Agent Planning System</p>
        </div>
    </body>
    </html>
    """
    
    return html_template