# Plannerium - Intelligent Multi-Agent Planning System

A comprehensive AI-powered project planning system that uses multiple specialized agents to break down goals, prioritize tasks, create schedules, analyze risks, and optimize project plans.

## Features

- **Multi-Agent AI Pipeline**: 5 specialized agents work together to create comprehensive project plans
- **Intelligent Task Breakdown**: Automatically decomposes goals into actionable tasks and milestones
- **Smart Prioritization**: Uses impact, urgency, and effort scoring to prioritize tasks
- **Optimized Scheduling**: Creates week-by-week schedules respecting dependencies and time constraints
- **Risk Analysis**: Identifies potential risks with severity levels and mitigation strategies
- **Project Optimization**: Suggests improvements for scope, timeline, and resource allocation
- **Visual Analytics**: Interactive charts showing workload distribution and task priorities
- **Export Capabilities**: Generate professional PDF reports and CSV schedules
- **Project Management**: Save, load, and manage multiple project plans
- **AI Chat Assistant**: Get help with project planning questions
- **Modern UI**: Clean, responsive design with light/dark theme support

## System Requirements

- Python 3.8+
- Google Gemini API key
- Modern web browser

## Installation

1. **Clone the repository** (or create the project directory)
```bash
git clone <repository-url>
cd Plannerium
```

2. **Create a virtual environment** (recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
Create a `.env` file in the project root:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

5. **Create storage directory**
```bash
mkdir storage
```

## Usage

1. **Start the Flask server**
```bash
python app.py
```

2. **Open your browser** and navigate to:
```
http://localhost:5000
```

3. **Configure your project**:
   - Enter your project goal
   - Set start date and deadline
   - Specify available hours per week

4. **Generate your plan** by clicking "Generate Plan"

5. **Explore the results**:
   - View task breakdown and priorities
   - Check the weekly schedule
   - Review risk analysis
   - See optimization suggestions
   - Analyze visual charts

6. **Export your plan**:
   - Download PDF report with full analysis
   - Export CSV schedule for external tools

7. **Use the AI assistant** for planning questions

## Architecture

### Backend Components

- **app.py**: Main Flask application with API endpoints
- **agents.py**: Multi-agent pipeline implementation
- **utils.py**: Utility functions for file operations and exports

### Frontend Components

- **templates/index.html**: Main application interface
- **static/style.css**: Complete styling with theme support
- **static/script.js**: Frontend logic and API interactions

### Multi-Agent Pipeline

1. **Decomposition Agent**: Breaks down goals into tasks and milestones
2. **Prioritization Agent**: Scores tasks based on impact, urgency, and effort
3. **Scheduling Agent**: Creates optimized weekly schedules
4. **Risk Analysis Agent**: Identifies and assesses project risks
5. **Optimization Agent**: Suggests improvements to the plan

## API Endpoints

- `POST /api/plan`: Generate comprehensive project plan
- `POST /api/save_project`: Save project to storage
- `GET /api/load_project/<name>`: Load project from storage
- `GET /api/list_projects`: List all saved projects
- `POST /api/export_csv`: Export schedule as CSV
- `POST /api/export_pdf`: Export plan as PDF
- `POST /api/chat`: AI chat assistant

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

### Customization Options

- Modify agent prompts in `agents.py` for different planning styles
- Adjust styling in `static/style.css` for custom themes
- Extend export formats in `utils.py`

## Development

### Project Structure
```
Plannerium/
├── app.py                 # Flask application
├── agents.py              # Multi-agent pipeline
├── utils.py               # Utility functions
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main UI template
├── static/
│   ├── style.css         # Complete styling
│   └── script.js         # Frontend logic
└── storage/              # Saved projects directory
```

### Adding New Features

1. **New Agent**: Add agent function to `agents.py` and integrate in pipeline
2. **New Export Format**: Extend `utils.py` with new export function
3. **New UI Component**: Update `templates/index.html` and `static/script.js`
4. **New API Endpoint**: Add route in `app.py`

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `GEMINI_API_KEY` is set in `.env` file
2. **Port Already in Use**: Change port in `app.py` or kill existing process
3. **Missing Dependencies**: Run `pip install -r requirements.txt` again
4. **PDF Export Issues**: Ensure WeasyPrint dependencies are installed

### Performance Tips

- Use virtual environment for clean dependency management
- Consider using a production WSGI server for deployment
- Implement caching for frequently accessed projects
- Use environment-specific configurations

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Examine browser console for frontend errors
4. Check Flask logs for backend issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Plannerium** - Making project planning intelligent, efficient, and accessible.