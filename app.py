import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory
import base64
from flask_cors import CORS
try:
    from google import genai
except Exception:
    genai = None
from dotenv import load_dotenv
from utils import save_project_to_file, load_project_from_file, generate_csv, generate_pdf, generate_ics
from agents import run_planning_pipeline

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
gemini_api_key = os.getenv('GEMINI_API_KEY')

# Initialize the new Google GenAI client when available
if gemini_api_key and genai is not None:
    try:
        client = genai.Client(api_key=gemini_api_key)
    except Exception:
        client = None
else:
    client = None

# Model id (kept even if client is None so callers can see the intended model)
model = "gemini-2.5-flash"

# Ensure storage directory exists
os.makedirs('storage', exist_ok=True)

@app.route('/')
def homepage():
    """Render the beautiful homepage."""
    return render_template('homepage.html')

@app.route('/app')
def index():
    """Render the main application interface."""
    return render_template('index.html')

@app.route('/login')
def login():
    """Render the login/signup page."""
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    """Render the Mission Control dashboard."""
    return render_template('dashboard.html')

@app.route('/projects')
def projects():
    """Render the Projects page."""
    return render_template('projects.html')

@app.route('/analytics')
def analytics():
    """Render the Analytics page."""
    return render_template('analytics.html')

@app.route('/settings')
def settings():
    """Render the Settings page."""
    return render_template('settings.html')

@app.route('/image/<path:filename>')
def serve_image(filename):
    return send_from_directory('image', filename)

@app.route('/api/plan', methods=['POST'])
def generate_plan():
    """Generate a comprehensive project plan using the multi-agent pipeline."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['goal', 'start_date', 'deadline', 'hours_per_week']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # If the GenAI client is not configured, return a lightweight demo plan
        if client is None:
            # Create a simple mock plan so the UI can be tested without an API key
            try:
                sd = datetime.fromisoformat(data['start_date'])
                ed = datetime.fromisoformat(data['deadline'])
            except Exception:
                sd = datetime.now()
                ed = sd + timedelta(weeks=4)

            days = max(1, (ed - sd).days)
            weeks = max(1, (days // 7) + 1)

            tasks = []
            for i in range(1, 7):
                tasks.append({
                    'id': f'task_{i}',
                    'title': f'Sample Task {i}',
                    'description': 'This is a demo task generated in offline/demo mode.',
                    'milestone': f'Milestone {((i-1)//2)+1}',
                    'estimated_hours': max(1, int(data['hours_per_week']) // 3),
                    'dependencies': [],
                    'deliverable': 'Demo deliverable',
                    'impact_score': 6,
                    'urgency_score': 5,
                    'effort_score': 5,
                    'priority_score': 16,
                    'priority_label': 'Medium'
                })

            schedule = []
            for w in range(weeks):
                schedule.append({
                    'week_start': (sd + timedelta(weeks=w)).date().isoformat(),
                    'week_number': w + 1,
                    'hours_planned': int(data['hours_per_week']),
                    'tasks': [
                        {
                            'task_id': tasks[(w) % len(tasks)]['id'],
                            'task_title': tasks[(w) % len(tasks)]['title'],
                            'hours_assigned': int(data['hours_per_week']) // 2,
                            'milestone': tasks[(w) % len(tasks)]['milestone']
                        }
                    ]
                })

            plan_result = {
                'goal': data['goal'],
                'start_date': data['start_date'],
                'deadline': data['deadline'],
                'hours_per_week': data['hours_per_week'],
                'tasks': tasks,
                'schedule': schedule,
                'risks': [
                    {'id': 'risk_1', 'description': 'Demo risk: scope creep', 'probability': 'Medium', 'impact': 'Medium', 'severity': 'Medium', 'mitigation': 'Keep scope small'}
                ],
                'optimizations': [
                    {'category': 'Scope Reduction', 'title': 'Demo: Use library', 'description': 'Use existing libraries to save time', 'impact': 'Saves time', 'priority': 'Medium'}
                ],
                'generated_at': datetime.now().isoformat(),
                'performance_metrics': {
                    'total_time': 0.0,
                    'agent_times': {},
                    'total_tasks': len(tasks),
                    'total_schedule_weeks': len(schedule),
                    'total_risks': 1,
                    'total_optimizations': 1
                }
            }
        else:
            # Run the multi-agent planning pipeline
            plan_result = run_planning_pipeline(
                goal=data['goal'],
                start_date=data['start_date'],
                deadline=data['deadline'],
                hours_per_week=data['hours_per_week'],
                model=model,
                client=client
            )
        
        # Log performance metrics
        if 'performance_metrics' in plan_result:
            metrics = plan_result['performance_metrics']
            app.logger.info(f"Planning completed in {metrics['total_time']}s")
            app.logger.info(f"Agent times: {metrics['agent_times']}")
        
        return jsonify(plan_result)
    
    except Exception as e:
        app.logger.error(f"Error generating plan: {str(e)}")
        return jsonify({'error': 'Failed to generate plan'}), 500

@app.route('/api/save_project', methods=['POST'])
def save_project():
    """Save a project to the storage system."""
    try:
        data = request.get_json()
        
        if 'project_name' not in data or 'project_data' not in data:
            return jsonify({'error': 'Missing project_name or project_data'}), 400
        
        project_name = data['project_name']
        project_data = data['project_data']
        
        # Add metadata
        project_data['saved_at'] = datetime.now().isoformat()
        project_data['project_name'] = project_name
        
        # Save to file
        success = save_project_to_file(project_name, project_data)
        
        if success:
            return jsonify({'message': 'Project saved successfully'})
        else:
            return jsonify({'error': 'Failed to save project'}), 500
    
    except Exception as e:
        app.logger.error(f"Error saving project: {str(e)}")
        return jsonify({'error': 'Failed to save project'}), 500

@app.route('/api/load_project/<project_name>', methods=['GET'])
def load_project(project_name):
    """Load a project from the storage system."""
    try:
        project_data = load_project_from_file(project_name)
        
        if project_data:
            return jsonify(project_data)
        else:
            return jsonify({'error': 'Project not found'}), 404
    
    except Exception as e:
        app.logger.error(f"Error loading project: {str(e)}")
        return jsonify({'error': 'Failed to load project'}), 500

@app.route('/api/list_projects', methods=['GET'])
def list_projects():
    """List all saved projects."""
    try:
        projects = []
        storage_dir = 'storage'
        
        if os.path.exists(storage_dir):
            for filename in os.listdir(storage_dir):
                if filename.endswith('.json'):
                    project_name = filename[:-5]  # Remove .json extension
                    projects.append(project_name)
        
        return jsonify({'projects': projects})
    
    except Exception as e:
        app.logger.error(f"Error listing projects: {str(e)}")
        return jsonify({'error': 'Failed to list projects'}), 500

@app.route('/api/export_csv', methods=['POST'])
def export_csv():
    """Export project schedule to CSV format."""
    try:
        data = request.get_json()
        
        if 'project_data' not in data:
            return jsonify({'error': 'Missing project_data'}), 400
        
        project_data = data['project_data']
        csv_content = generate_csv(project_data)
        
        return jsonify({
            'csv_content': csv_content,
            'filename': f"{project_data.get('project_name', 'project')}_schedule.csv"
        })
    
    except Exception as e:
        app.logger.error(f"Error exporting CSV: {str(e)}")
        return jsonify({'error': 'Failed to export CSV'}), 500

@app.route('/api/export_pdf', methods=['POST'])
def export_pdf():
    """Export project to PDF format."""
    try:
        data = request.get_json()
        
        if 'project_data' not in data:
            return jsonify({'error': 'Missing project_data'}), 400
        
        project_data = data['project_data']
        pdf_content = generate_pdf(project_data)
        
        if not pdf_content:
            return jsonify({'error': 'PDF generation not available. Please install WeasyPrint dependencies.'}), 503
        
        encoded = base64.b64encode(pdf_content).decode('ascii')
        return jsonify({
            'pdf_content': encoded,
            'filename': f"{project_data.get('project_name', 'project')}_plan.pdf"
        })
    
    except Exception as e:
        app.logger.error(f"Error exporting PDF: {str(e)}")
        return jsonify({'error': 'Failed to export PDF'}), 500

@app.route('/api/export_ics', methods=['POST'])
def export_ics():
    """Export project schedule to ICS format."""
    try:
        data = request.get_json()
        
        if 'project_data' not in data:
            return jsonify({'error': 'Missing project_data'}), 400
        
        project_data = data['project_data']
        ics_content = generate_ics(project_data)
        
        return jsonify({
            'ics_content': ics_content,
            'filename': f"{project_data.get('project_name', 'project')}_schedule.ics"
        })
    
    except Exception as e:
        app.logger.error(f"Error exporting ICS: {str(e)}")
        return jsonify({'error': 'Failed to export ICS'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """AI chat assistant endpoint using Gemini."""
    try:
        data = request.get_json()
        
        if 'message' not in data:
            return jsonify({'error': 'Missing message'}), 400
        
        message = data['message']
        context = data.get('context', '')
        
        # Build context-aware prompt
        prompt = f"""You are Plannerium's AI assistant, helping users with project planning and management.
        
Context: {context}

User Question: {message}

Please provide a helpful, concise response focused on project planning, task management, and productivity."""
        
        if client is None:
            # Return a friendly demo-mode response when AI client is not configured
            demo_reply = (
                "You're running Plannerium in demo mode. "
                "Set the GEMINI_API_KEY environment variable and install the Google GenAI SDK to enable full AI chat responses. "
                "In the meantime, here's a quick tip: break large goals into smaller milestones and assign weekly timeboxes."
            )
            return jsonify({'response': demo_reply, 'timestamp': datetime.now().isoformat()})

        response = client.models.generate_content(model=model, contents=prompt)

        return jsonify({
            'response': response.text,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        app.logger.error(f"Error in chat: {str(e)}")
        return jsonify({'error': 'Failed to generate response'}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)