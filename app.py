import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv
from utils import save_project_to_file, load_project_from_file, generate_csv, generate_pdf
from agents import run_planning_pipeline

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Initialize the new Google GenAI client
client = genai.Client(api_key=gemini_api_key)
model = "gemini-2.5-flash"

# Ensure storage directory exists
os.makedirs('storage', exist_ok=True)

@app.route('/')
def index():
    """Render the main application interface."""
    return render_template('index.html')

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
        
        return jsonify({
            'pdf_content': pdf_content.decode('latin1'),  # Encode for JSON transmission
            'filename': f"{project_data.get('project_name', 'project')}_plan.pdf"
        })
    
    except Exception as e:
        app.logger.error(f"Error exporting PDF: {str(e)}")
        return jsonify({'error': 'Failed to export PDF'}), 500

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