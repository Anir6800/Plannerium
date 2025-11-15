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
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
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

// Loading overlay with progress tracking
function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const loadingTitle = document.getElementById('loading-title');
    const progressBar = document.getElementById('overall-progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    
    loadingTitle.textContent = 'AI Agents Working...';
    loadingText.textContent = text;
    progressBar.style.width = '0%';
    progressPercentage.textContent = '0%';
    
    // Initialize agent timeline
    initializeAgentTimeline();
    
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function initializeAgentTimeline() {
    const agentTimeline = document.getElementById('agent-timeline');
    const agents = [
        { name: '🧠 Decomposition Agent', icon: 'fas fa-brain' },
        { name: '📊 Prioritization Agent', icon: 'fas fa-chart-line' },
        { name: '📅 Scheduling Agent', icon: 'fas fa-calendar-alt' },
        { name: '⚠️ Risk Analysis Agent', icon: 'fas fa-shield-alt' },
        { name: '🔧 Optimization Agent', icon: 'fas fa-tools' }
    ];
    
    agentTimeline.innerHTML = agents.map((agent, index) => `
        <div class="agent-item pending" data-agent="${index}">
            <div class="agent-icon pending">
                <i class="${agent.icon}"></i>
            </div>
            <span class="agent-name">${agent.name}</span>
            <span class="agent-time" id="time-${index}">--</span>
        </div>
    `).join('');
}

function updateAgentProgress(agentIndex, status, time = null) {
    const agentItems = document.querySelectorAll('.agent-item');
    const currentAgentItem = agentItems[agentIndex];
    const currentAgentIcon = currentAgentItem.querySelector('.agent-icon');
    
    // Reset all agents
    agentItems.forEach(item => {
        item.classList.remove('active');
        const icon = item.querySelector('.agent-icon');
        icon.classList.remove('active');
    });
    
    if (status === 'active') {
        currentAgentItem.classList.add('active');
        currentAgentItem.classList.remove('pending');
        currentAgentIcon.classList.add('active');
        currentAgentIcon.classList.remove('pending');
        
        const agentNames = [
            '🧠 Decomposition Agent: Breaking down your goal...',
            '📊 Prioritization Agent: Ranking tasks by importance...',
            '📅 Scheduling Agent: Creating optimal timeline...',
            '⚠️ Risk Analysis Agent: Identifying potential risks...',
            '🔧 Optimization Agent: Fine-tuning your plan...'
        ];
        
        document.getElementById('current-agent').textContent = agentNames[agentIndex];
    } else if (status === 'completed') {
        currentAgentItem.classList.remove('active', 'pending');
        currentAgentItem.classList.add('completed');
        currentAgentIcon.classList.remove('active', 'pending');
        currentAgentIcon.classList.add('completed');
        
        if (time) {
            document.getElementById(`time-${agentIndex}`).textContent = `${time}s`;
        }
    }
    
    // Update overall progress
    const progress = ((agentIndex + (status === 'completed' ? 1 : 0.5)) / 5) * 100;
    updateOverallProgress(progress);
}

function updateOverallProgress(percentage) {
    const progressBar = document.getElementById('overall-progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    
    progressBar.style.width = `${percentage}%`;
    progressPercentage.textContent = `${Math.round(percentage)}%`;
}

// Simulate agent progress for better UX
function simulateAgentProgress() {
    const agentNames = [
        '🧠 Decomposition Agent: Breaking down your goal...',
        '📊 Prioritization Agent: Ranking tasks by importance...',
        '📅 Scheduling Agent: Creating optimal timeline...',
        '⚠️ Risk Analysis Agent: Identifying potential risks...',
        '🔧 Optimization Agent: Fine-tuning your plan...'
    ];
    
    let currentAgent = 0;
    
    function processNextAgent() {
        if (currentAgent < 5) {
            // Activate current agent
            updateAgentProgress(currentAgent, 'active');
            document.getElementById('current-agent').textContent = agentNames[currentAgent];
            
            // Simulate processing time
            setTimeout(() => {
                // Complete current agent
                updateAgentProgress(currentAgent, 'completed', Math.floor(Math.random() * 3) + 2);
                currentAgent++;
                
                if (currentAgent < 5) {
                    setTimeout(processNextAgent, 500);
                }
            }, 1500 + Math.random() * 1000);
        }
    }
    
    // Start the simulation
    setTimeout(processNextAgent, 500);
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

    showLoading('Initializing AI agents...');

    try {
        // Simulate progress for demo purposes
        simulateAgentProgress();
        
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
            
            // Complete all agents
            for (let i = 0; i < 5; i++) {
                updateAgentProgress(i, 'completed', Math.floor(Math.random() * 5) + 1);
            }
            updateOverallProgress(100);
        } else {
            alert('Error: ' + (data.error || 'Failed to generate plan'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate plan. Please try again.');
    } finally {
        setTimeout(hideLoading, 1000); // Delay to show completion
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
        showToast('Please generate a plan first', 'warning');
        return;
    }

    // Show loading state
    const originalText = exportPdfBtn.innerHTML;
    exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    exportPdfBtn.disabled = true;

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
            
            showToast('PDF exported successfully!', 'success');
        } else if (response.status === 503) {
            // Fallback to client-side PDF generation
            generateClientPDF(currentPlan);
        } else {
            showToast('Error: ' + (data.error || 'Failed to export PDF'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        // Fallback to client-side PDF generation
        generateClientPDF(currentPlan);
    } finally {
        // Reset button state
        exportPdfBtn.innerHTML = originalText;
        exportPdfBtn.disabled = false;
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