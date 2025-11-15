// Global variables
let currentPlan = null;
let currentProjectName = '';
let charts = {};
let chatContext = '';

// Theme management
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

// Chat panel management
const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const closeChat = document.getElementById('close-chat');

chatToggle.addEventListener('click', () => {
    chatPanel.classList.toggle('open');
});

closeChat.addEventListener('click', () => {
    chatPanel.classList.remove('open');
});

// Tab management
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
        
        // Update charts if visuals tab
        if (targetTab === 'visuals' && currentPlan) {
            updateCharts();
        }
    });
});

// Loading overlay
function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = text;
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Generate Plan
const generatePlanBtn = document.getElementById('generate-plan');
generatePlanBtn.addEventListener('click', async () => {
    const goal = document.getElementById('goal').value.trim();
    const startDate = document.getElementById('start-date').value;
    const deadline = document.getElementById('deadline').value;
    const hoursPerWeek = document.getElementById('hours-per-week').value;

    if (!goal || !startDate || !deadline || !hoursPerWeek) {
        alert('Please fill in all required fields');
        return;
    }

    if (new Date(startDate) >= new Date(deadline)) {
        alert('Start date must be before deadline');
        return;
    }

    showLoading('Generating your comprehensive plan...');

    try {
        const response = await fetch('/api/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                goal,
                start_date: startDate,
                deadline,
                hours_per_week: parseInt(hoursPerWeek)
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentPlan = data;
            displayResults(data);
            updateChatContext(data);
            document.getElementById('results-section').style.display = 'block';
        } else {
            alert('Error: ' + (data.error || 'Failed to generate plan'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate plan. Please try again.');
    } finally {
        hideLoading();
    }
});

function displayResults(plan) {
    displayTasks(plan.tasks);
    displaySchedule(plan.schedule);
    displayRisks(plan.risks);
    displayOptimizations(plan.optimizations);
    updateProgress(plan.tasks);
}

function displayTasks(tasks) {
    const container = document.getElementById('tasks-container');
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p>No tasks available</p>';
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Milestone</th>
                    <th>Hours</th>
                    <th>Priority</th>
                    <th>Dependencies</th>
                    <th>Progress</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => `
                    <tr>
                        <td>
                            <strong>${task.title}</strong>
                            <br><small>${task.description}</small>
                        </td>
                        <td>${task.milestone}</td>
                        <td>${task.estimated_hours}</td>
                        <td><span class="priority-badge priority-${task.priority_label.toLowerCase()}">${task.priority_label}</span></td>
                        <td>${task.dependencies.join(', ') || '-'}</td>
                        <td>
                            <div class="progress-bar" style="width: 100px;">
                                <div class="progress-fill" style="width: 0%; background: var(--success);"></div>
                            </div>
                            <small>0%</small>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

function displaySchedule(schedule) {
    const container = document.getElementById('schedule-container');
    
    if (!schedule || schedule.length === 0) {
        container.innerHTML = '<p>No schedule available</p>';
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Week</th>
                    <th>Start Date</th>
                    <th>Hours Planned</th>
                    <th>Tasks</th>
                </tr>
            </thead>
            <tbody>
                ${schedule.map(week => `
                    <tr>
                        <td>Week ${week.week_number}</td>
                        <td>${week.week_start}</td>
                        <td>${week.hours_planned}</td>
                        <td>
                            ${week.tasks.map(task => `
                                <div><strong>${task.task_title}</strong> (${task.hours_assigned}h)</div>
                            `).join('')}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

function displayRisks(risks) {
    const container = document.getElementById('risks-container');
    
    if (!risks || risks.length === 0) {
        container.innerHTML = '<p>No risks identified</p>';
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Risk</th>
                    <th>Probability</th>
                    <th>Impact</th>
                    <th>Severity</th>
                    <th>Mitigation</th>
                </tr>
            </thead>
            <tbody>
                ${risks.map(risk => `
                    <tr>
                        <td><strong>${risk.description}</strong></td>
                        <td>${risk.probability}</td>
                        <td>${risk.impact}</td>
                        <td><span class="priority-badge priority-${risk.severity.toLowerCase()}">${risk.severity}</span></td>
                        <td>${risk.mitigation}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

function displayOptimizations(optimizations) {
    const container = document.getElementById('optimizer-container');
    
    if (!optimizations || optimizations.length === 0) {
        container.innerHTML = '<p>No optimization suggestions available</p>';
        return;
    }

    const categories = {};
    optimizations.forEach(opt => {
        if (!categories[opt.category]) categories[opt.category] = [];
        categories[opt.category].push(opt);
    });

    let html = '';
    Object.entries(categories).forEach(([category, items]) => {
        html += `
            <div class="optimization-category">
                <h4>${category}</h4>
                ${items.map(item => `
                    <div class="optimization-item">
                        <h5>${item.title}</h5>
                        <p>${item.description}</p>
                        <small><strong>Impact:</strong> ${item.impact}</small>
                    </div>
                `).join('')}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateProgress(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = 0; // Will be updated when tasks are marked complete
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    document.getElementById('overall-progress').style.width = progress + '%';
    document.getElementById('progress-text').textContent = progress + '%';
}

function updateChatContext(plan) {
    chatContext = `Project: ${plan.goal}\nStart: ${plan.start_date}\nDeadline: ${plan.deadline}\nTasks: ${plan.tasks.length}\nTotal Hours: ${plan.tasks.reduce((sum, task) => sum + task.estimated_hours, 0)}`;
}

// Charts
function updateCharts() {
    if (!currentPlan) return;

    // Weekly hours chart
    const schedule = currentPlan.schedule || [];
    const weeks = schedule.map(week => `Week ${week.week_number}`);
    const hours = schedule.map(week => week.hours_planned);

    if (charts.hoursChart) {
        charts.hoursChart.destroy();
    }

    const hoursCtx = document.getElementById('hours-chart').getContext('2d');
    charts.hoursChart = new Chart(hoursCtx, {
        type: 'line',
        data: {
            labels: weeks,
            datasets: [{
                label: 'Planned Hours',
                data: hours,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Weekly Hours Distribution'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            }
        }
    });

    // Task distribution chart
    const tasks = currentPlan.tasks || [];
    const priorityCounts = {
        'High': tasks.filter(t => t.priority_label === 'High').length,
        'Medium': tasks.filter(t => t.priority_label === 'Medium').length,
        'Low': tasks.filter(t => t.priority_label === 'Low').length
    };

    if (charts.distributionChart) {
        charts.distributionChart.destroy();
    }

    const distributionCtx = document.getElementById('distribution-chart').getContext('2d');
    charts.distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(priorityCounts),
            datasets: [{
                data: Object.values(priorityCounts),
                backgroundColor: [
                    '#dc3545', // High - Red
                    '#ffc107', // Medium - Yellow
                    '#28a745'  // Low - Green
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Task Priority Distribution'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Project Save/Load
const saveProjectBtn = document.getElementById('save-project');
const projectSelect = document.getElementById('project-select');
const deleteProjectBtn = document.getElementById('delete-project');

saveProjectBtn.addEventListener('click', async () => {
    if (!currentPlan) {
        alert('Please generate a plan first');
        return;
    }

    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    try {
        const response = await fetch('/api/save_project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_name: projectName,
                project_data: currentPlan
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Project saved successfully!');
            loadProjectList();
        } else {
            alert('Error: ' + (data.error || 'Failed to save project'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save project. Please try again.');
    }
});

async function loadProjectList() {
    try {
        const response = await fetch('/api/list_projects');
        const data = await response.json();

        if (response.ok) {
            projectSelect.innerHTML = '<option value="">Load Project...</option>';
            data.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project;
                option.textContent = project;
                projectSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

projectSelect.addEventListener('change', async () => {
    const projectName = projectSelect.value;
    if (!projectName) return;

    try {
        const response = await fetch(`/api/load_project/${projectName}`);
        const data = await response.json();

        if (response.ok) {
            currentPlan = data;
            displayResults(data);
            updateChatContext(data);
            document.getElementById('results-section').style.display = 'block';
            
            // Populate input fields
            document.getElementById('goal').value = data.goal;
            document.getElementById('start-date').value = data.start_date;
            document.getElementById('deadline').value = data.deadline;
            document.getElementById('hours-per-week').value = data.hours_per_week;
        } else {
            alert('Error: ' + (data.error || 'Failed to load project'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load project. Please try again.');
    }
});

deleteProjectBtn.addEventListener('click', async () => {
    const projectName = projectSelect.value;
    if (!projectName) {
        alert('Please select a project to delete');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) return;

    try {
        // For now, we'll just remove it from the dropdown
        // In a real app, you'd have a delete endpoint
        projectSelect.removeChild(projectSelect.querySelector(`option[value="${projectName}"]`));
        projectSelect.value = '';
        alert('Project deleted successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete project. Please try again.');
    }
});

// Export functionality
const exportCsvBtn = document.getElementById('export-csv');
const exportPdfBtn = document.getElementById('export-pdf');

exportCsvBtn.addEventListener('click', async () => {
    if (!currentPlan) {
        alert('Please generate a plan first');
        return;
    }

    try {
        const response = await fetch('/api/export_csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_data: currentPlan
            })
        });

        const data = await response.json();

        if (response.ok) {
            downloadFile(data.csv_content, data.filename, 'text/csv');
        } else {
            alert('Error: ' + (data.error || 'Failed to export CSV'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to export CSV. Please try again.');
    }
});

exportPdfBtn.addEventListener('click', async () => {
    if (!currentPlan) {
        alert('Please generate a plan first');
        return;
    }

    try {
        const response = await fetch('/api/export_pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_data: currentPlan
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Convert base64 to blob and download
            const byteCharacters = atob(data.pdf_content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else if (response.status === 503) {
            alert('PDF export is currently unavailable. CSV export is still available.');
        } else {
            alert('Error: ' + (data.error || 'Failed to export PDF'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to export PDF. Please try again.');
    }
});

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Chat functionality
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');
const chatMessages = document.getElementById('chat-messages');

function addChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addChatMessage(message, 'user');
    chatInput.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                context: chatContext
            })
        });

        const data = await response.json();

        if (response.ok) {
            addChatMessage(data.response, 'ai');
        } else {
            addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    } catch (error) {
        console.error('Error:', error);
        addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
}

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// Initialize
initTheme();
loadProjectList();

// Set default dates
const today = new Date();
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
document.getElementById('start-date').value = today.toISOString().split('T')[0];
document.getElementById('deadline').value = nextMonth.toISOString().split('T')[0];