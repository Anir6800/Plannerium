import json
import os
import csv
import io
from datetime import datetime
from typing import Dict, List, Any
import pandas as pd

# WeasyPrint availability flag
WEASYPRINT_AVAILABLE = False

def check_weasyprint_available():
    """Check if WeasyPrint is available and set the flag."""
    global WEASYPRINT_AVAILABLE
    try:
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        WEASYPRINT_AVAILABLE = True
        return True
    except ImportError:
        WEASYPRINT_AVAILABLE = False
        print("Warning: WeasyPrint not available. PDF export will be disabled.")
        return False

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
        # Check if WeasyPrint is available and working
        if not check_weasyprint_available():
            print("PDF generation disabled - WeasyPrint not available")
            return b""
        
        try:
            # Import WeasyPrint only when needed
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration
            
            # Create comprehensive HTML content for PDF
            html_content = create_comprehensive_pdf_html(project_data)
            
            # Configure fonts
            font_config = FontConfiguration()
            
            # Generate PDF
            pdf_bytes = HTML(string=html_content).write_pdf(
                font_config=font_config
            )
            
            return pdf_bytes
        
        except Exception as weasyprint_error:
            print(f"WeasyPrint error: {weasyprint_error}")
            print("Falling back to simple PDF generation")
            # Fall back to simpler HTML to PDF conversion
            try:
                from weasyprint import HTML
                html_content = create_pdf_html(project_data)
                pdf_bytes = HTML(string=html_content).write_pdf()
                return pdf_bytes
            except Exception as fallback_error:
                print(f"Fallback PDF generation failed: {fallback_error}")
                return b""
    
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

def create_comprehensive_pdf_html(project_data: Dict[str, Any]) -> str:
    """Create comprehensive HTML content for PDF generation with time tracking and all components."""
    project_name = project_data.get('project_name', 'Project Plan')
    goal = project_data.get('goal', 'No goal specified')
    start_date = project_data.get('start_date', '')
    deadline = project_data.get('deadline', '')
    hours_per_week = project_data.get('hours_per_week', 0)
    
    tasks = project_data.get('tasks', [])
    schedule = project_data.get('schedule', [])
    risks = project_data.get('risks', [])
    optimizations = project_data.get('optimizations', [])
    time_tracking = project_data.get('time_tracking', {})
    performance_metrics = project_data.get('performance_metrics', {})
    
    # Calculate time statistics
    time_stats = calculate_time_statistics(project_data)
    
    # Generate comprehensive task table
    task_rows = ""
    for task in tasks:
        priority_color = {
            'High': '#dc3545',
            'Medium': '#ffc107',
            'Low': '#28a745'
        }.get(task.get('priority_label', 'Medium'), '#6c757d')
        
        timer_data = time_tracking.get('taskTimers', {}).get(task.get('id', ''), {})
        actual_time = time_tracking.get('actualTimes', {}).get(task.get('id', ''), {})
        
        task_status = "Not Started"
        if timer_data.get('completed'):
            task_status = "Completed"
        elif timer_data.get('startTime'):
            task_status = "In Progress"
        
        task_rows += f"""
        <tr>
            <td>{task.get('title', '')}</td>
            <td>{task.get('milestone', '')}</td>
            <td>{task.get('estimated_hours', 0)}</td>
            <td>{actual_time.get('actual', 0):.1f) if actual_time else '0.0'}</td>
            <td>{actual_time.get('variance', 0):.1f) if actual_time else '0.0'}</td>
            <td><span style="color: {priority_color}; font-weight: bold;">{task.get('priority_label', '')}</span></td>
            <td>{task_status}</td>
            <td>{', '.join(task.get('dependencies', []))}</td>
        </tr>
        """
    
    # Generate enhanced schedule table
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
    
    # Generate time tracking summary
    time_tracking_summary = ""
    if time_stats:
        time_tracking_summary = f"""
        <div class="time-summary-section">
            <h3>Time Tracking Summary</h3>
            <div class="time-stats-grid">
                <div class="time-stat-card">
                    <h4>Project Duration</h4>
                    <p><strong>Start:</strong> {start_date}</p>
                    <p><strong>Deadline:</strong> {deadline}</p>
                    <p><strong>Time Remaining:</strong> {time_stats.get('time_left', 'N/A')}</p>
                </div>
                <div class="time-stat-card">
                    <h4>Time Analysis</h4>
                    <p><strong>Total Estimated:</strong> {time_stats.get('total_estimated', 0):.1f} hours</p>
                    <p><strong>Total Actual:</strong> {time_stats.get('total_actual', 0):.1f} hours</p>
                    <p><strong>Variance:</strong> <span style="color: {'#dc3545' if time_stats.get('variance', 0) > 0 else '#28a745'}; font-weight: bold;">{time_stats.get('variance', 0):+.1f} hours</span></p>
                </div>
                <div class="time-stat-card">
                    <h4>Progress Metrics</h4>
                    <p><strong>Tasks Completed:</strong> {time_stats.get('completed_tasks', 0)} / {time_stats.get('total_tasks', 0)}</p>
                    <p><strong>Project Progress:</strong> {time_stats.get('progress_percentage', 0):.1f}%</p>
                    <p><strong>On Track:</strong> {'Yes' if time_stats.get('on_track', True) else 'No'}</p>
                </div>
            </div>
        </div>
        """
    
    # Generate performance metrics section
    performance_section = ""
    if performance_metrics:
        agent_times = performance_metrics.get('agent_times', {})
        performance_section = f"""
        <div class="performance-section">
            <h3>AI Performance Metrics</h3>
            <table class="performance-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total Planning Time</td>
                        <td>{performance_metrics.get('total_time', 0):.2f} seconds</td>
                    </tr>
                    <tr>
                        <td>Tasks Generated</td>
                        <td>{performance_metrics.get('total_tasks', 0)}</td>
                    </tr>
                    <tr>
                        <td>Schedule Weeks</td>
                        <td>{performance_metrics.get('total_schedule_weeks', 0)}</td>
                    </tr>
                    <tr>
                        <td>Risks Identified</td>
                        <td>{performance_metrics.get('total_risks', 0)}</td>
                    </tr>
                    <tr>
                        <td>Optimizations Suggested</td>
                        <td>{performance_metrics.get('total_optimizations', 0)}</td>
                    </tr>
                </tbody>
            </table>
            
            <h4>Agent Performance Times</h4>
            <table class="agent-performance-table">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Processing Time (seconds)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Decomposition Agent</td><td>{agent_times.get('decomposition', 0):.2f}</td></tr>
                    <tr><td>Prioritization Agent</td><td>{agent_times.get('prioritization', 0):.2f}</td></tr>
                    <tr><td>Scheduling Agent</td><td>{agent_times.get('scheduling', 0):.2f}</td></tr>
                    <tr><td>Risk Analysis Agent</td><td>{agent_times.get('risk_analysis', 0):.2f}</td></tr>
                    <tr><td>Optimization Agent</td><td>{agent_times.get('optimization', 0):.2f}</td></tr>
                </tbody>
            </table>
        </div>
        """
    
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{project_name} - Comprehensive Project Plan</title>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                background: #f8f9fa;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding: 30px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }}
            .header p {{
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }}
            .section {{
                background: white;
                margin-bottom: 30px;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                page-break-inside: avoid;
            }}
            .section h2 {{
                color: #007bff;
                border-bottom: 3px solid #007bff;
                padding-bottom: 10px;
                margin-bottom: 20px;
                font-size: 22px;
                font-weight: 700;
            }}
            .section h3 {{
                color: #495057;
                margin: 20px 0 15px 0;
                font-size: 18px;
                font-weight: 600;
            }}
            .project-info {{
                background: linear-gradient(135deg, #e3f2fd, #bbdefb);
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
                border-left: 5px solid #007bff;
            }}
            .project-info h3 {{
                margin-top: 0;
                color: #1565c0;
            }}
            .project-info p {{
                margin: 8px 0;
                font-size: 14px;
            }}
            .project-info strong {{
                color: #0d47a1;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 13px;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }}
            th {{
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                font-weight: 600;
                padding: 12px 8px;
                text-align: left;
                font-size: 12px;
            }}
            td {{
                padding: 10px 8px;
                border-bottom: 1px solid #e9ecef;
                vertical-align: top;
            }}
            tr:nth-child(even) {{
                background-color: #f8f9fa;
            }}
            tr:hover {{
                background-color: #e3f2fd;
            }}
            .time-summary-section {{
                background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
                border-left: 5px solid #28a745;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
            }}
            .time-stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }}
            .time-stat-card {{
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #dee2e6;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }}
            .time-stat-card h4 {{
                margin: 0 0 10px 0;
                color: #155724;
                font-size: 14px;
                font-weight: 600;
            }}
            .time-stat-card p {{
                margin: 5px 0;
                font-size: 13px;
                color: #495057;
            }}
            .performance-section {{
                background: linear-gradient(135deg, #fff3cd, #ffeaa7);
                border-left: 5px solid #ffc107;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
            }}
            .performance-table, .agent-performance-table {{
                margin: 15px 0;
                background: white;
            }}
            .performance-table th, .agent-performance-table th {{
                background: linear-gradient(135deg, #ffc107, #e0a800);
                color: #212529;
            }}
            .optimization-item {{
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                margin-bottom: 15px;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #17a2b8;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }}
            .optimization-item h5 {{
                color: #138496;
                margin: 0 0 8px 0;
                font-size: 15px;
                font-weight: 600;
            }}
            .optimization-item p {{
                margin: 0 0 8px 0;
                color: #495057;
                font-size: 13px;
            }}
            .optimization-item strong {{
                color: #0c5460;
            }}
            .footer {{
                text-align: center;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 2px solid #007bff;
                color: #6c757d;
                font-size: 12px;
            }}
            @media print {{
                .section {{
                    page-break-inside: avoid;
                    margin-bottom: 20px;
                }}
                body {{
                    background: white;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{project_name}</h1>
            <p>Comprehensive Project Plan with Time Tracking & Analytics</p>
            <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="project-info">
            <h3>Project Overview</h3>
            <p><strong>Goal:</strong> {goal}</p>
            <p><strong>Start Date:</strong> {start_date}</p>
            <p><strong>Deadline:</strong> {deadline}</p>
            <p><strong>Hours per Week:</strong> {hours_per_week}</p>
            <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        {time_tracking_summary}
        
        <div class="section">
            <h2>Tasks & Milestones with Time Tracking</h2>
            <table>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Milestone</th>
                        <th>Estimated Hours</th>
                        <th>Actual Hours</th>
                        <th>Variance</th>
                        <th>Priority</th>
                        <th>Status</th>
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
                    {''.join([f'''
                    <tr>
                        <td><strong>{risk.get('description', '')}</strong></td>
                        <td>{risk.get('probability', '')}</td>
                        <td>{risk.get('impact', '')}</td>
                        <td><span style="font-weight: bold; color: {{
                            '#dc3545' if risk.get('severity', '') == 'High' else
                            '#ffc107' if risk.get('severity', '') == 'Medium' else '#28a745'
                        }};">{risk.get('severity', '')}</span></td>
                        <td>{risk.get('mitigation', '')}</td>
                    </tr>
                    ''' for risk in risks])}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Optimization Suggestions</h2>
            {''.join([f'''
            <div class="optimization-item">
                <h5>{opt.get('title', '')} ({opt.get('category', '')})</h5>
                <p>{opt.get('description', '')}</p>
                <p><strong>Impact:</strong> {opt.get('impact', '')}</p>
            </div>
            ''' for opt in optimizations])}
        </div>
        
        {performance_section}
        
        <div class="footer">
            <p>Generated by Plannerium - Intelligent Multi-Agent Planning System</p>
            <p>Comprehensive project planning with AI-powered insights and time tracking</p>
        </div>
    </body>
    </html>
    """
    
    return html_template

def calculate_time_statistics(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate time-related statistics for the project."""
    try:
        tasks = project_data.get('tasks', [])
        time_tracking = project_data.get('time_tracking', {})
        deadline = project_data.get('deadline', '')
        
        # Calculate total estimated and actual hours
        total_estimated = sum(task.get('estimated_hours', 0) for task in tasks)
        total_actual = sum(
            time_data.get('actual', 0)
            for time_data in time_tracking.get('actualTimes', {}).values()
        )
        
        # Calculate variance
        variance = total_actual - total_estimated
        
        # Calculate progress
        total_tasks = len(tasks)
        completed_tasks = len([
            task for task in tasks
            if time_tracking.get('taskTimers', {}).get(task.get('id', ''), {}).get('completed', False)
        ])
        progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Calculate time left
        time_left = "N/A"
        if deadline:
            try:
                from datetime import datetime, timedelta
                deadline_date = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
                now = datetime.now()
                time_remaining = deadline_date - now
                if time_remaining.total_seconds() > 0:
                    days = time_remaining.days
                    hours = time_remaining.seconds // 3600
                    time_left = f"{days} days, {hours} hours"
                else:
                    time_left = "Overdue"
            except:
                time_left = "Invalid date"
        
        # Check if on track
        expected_progress = 50  # Example: 50% of project time should be complete
        on_track = progress_percentage >= expected_progress
        
        return {
            'total_estimated': total_estimated,
            'total_actual': total_actual,
            'variance': variance,
            'progress_percentage': progress_percentage,
            'completed_tasks': completed_tasks,
            'total_tasks': total_tasks,
            'time_left': time_left,
            'on_track': on_track
        }
    except Exception as e:
        print(f"Error calculating time statistics: {e}")
        return {}