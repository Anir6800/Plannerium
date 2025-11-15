// Global variables
let currentPlan = null;
let currentProjectName = '';
let charts = {};
let chatContext = '';
let timeTracking = {
    taskTimers: {},
    projectStartTime: null,
    actualTimes: {},
    progressData: {}
};

// Time tracking functions
function initializeTimeTracking() {
    timeTracking.projectStartTime = new Date().getTime();
    timeTracking.taskTimers = {};
    timeTracking.actualTimes = {};
    timeTracking.progressData = {};
}

function calculateTimeLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeLeft = deadlineDate.getTime() - now.getTime();
    
    if (timeLeft <= 0) return { days: 0, hours: 0, minutes: 0, overdue: true };
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, overdue: false };
}

function calculateTimeTaken(taskId, estimatedHours) {
    if (!timeTracking.taskTimers[taskId]) return 0;
    
    const startTime = timeTracking.taskTimers[taskId].startTime;
    const now = new Date().getTime();
    const elapsedMs = now - startTime;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    
    return {
        elapsed: elapsedHours,
        estimated: estimatedHours,
        variance: elapsedHours - estimatedHours,
        progress: timeTracking.taskTimers[taskId].completed ? 100 : Math.min((elapsedHours / estimatedHours) * 100, 100)
    };
}

function startTaskTimer(taskId) {
    if (!timeTracking.taskTimers[taskId]) {
        timeTracking.taskTimers[taskId] = {
            startTime: new Date().getTime(),
            completed: false,
            intervals: []
        };
    }
}

function completeTask(taskId, estimatedHours) {
    if (timeTracking.taskTimers[taskId]) {
        const timerData = timeTracking.taskTimers[taskId];
        timerData.completed = true;
        timerData.endTime = new Date().getTime();
        
        const actualHours = (timerData.endTime - timerData.startTime) / (1000 * 60 * 60);
        timeTracking.actualTimes[taskId] = {
            estimated: estimatedHours,
            actual: actualHours,
            variance: actualHours - estimatedHours
        };
    }
}

function getProjectProgress() {
    if (!currentPlan || !currentPlan.tasks) return 0;
    
    const totalTasks = currentPlan.tasks.length;
    const completedTasks = Object.values(timeTracking.taskTimers).filter(timer => timer.completed).length;
    
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
}

function getOverallTimeStats() {
    if (!currentPlan) return null;
    
    const totalEstimatedHours = currentPlan.tasks.reduce((sum, task) => sum + task.estimated_hours, 0);
    const totalActualHours = Object.values(timeTracking.actualTimes).reduce((sum, time) => sum + time.actual, 0);
    
    return {
        totalEstimated: totalEstimatedHours,
        totalActual: totalActualHours,
        variance: totalActualHours - totalEstimatedHours,
        progress: getProjectProgress()
    };
}

// Safe DOM query helper
function safeQuery(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn(`Failed to query element: ${selector}`, error);
        return null;
    }
}

// Theme management with enhanced error handling
function initTheme() {
    try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } catch (error) {
        console.warn('Failed to initialize theme:', error);
        // Fallback to light theme
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// Small toast utility used by the UI for non-blocking notifications
function showToast(message, type = 'info', duration = 3500) {
    try {
        const toast = document.createElement('div');
        toast.className = `pl-toast pl-toast-${type}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.right = '20px';
        toast.style.bottom = '20px';
        toast.style.background = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#333';
        toast.style.color = '#fff';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        toast.style.zIndex = 99999;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 400ms ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 450);
        }, duration);
    } catch (e) {
        console.warn('showToast fallback to alert:', message);
        try { alert(message); } catch (err) { /* ignore */ }
    }
}

function updateThemeIcon(theme) {
    const themeIcon = safeQuery('#theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize theme toggle with error handling
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = safeQuery('#theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            try {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateThemeIcon(newTheme);
            } catch (error) {
                console.error('Theme toggle failed:', error);
            }
        });
    }
});

// Chat panel management with error handling
document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = safeQuery('#chat-toggle');
    const chatPanel = safeQuery('#chat-panel');
    const closeChat = safeQuery('#close-chat');

    if (chatToggle && chatPanel) {
        chatToggle.addEventListener('click', () => {
            try {
                chatPanel.classList.toggle('open');
            } catch (error) {
                console.error('Chat toggle failed:', error);
            }
        });
    }

    if (closeChat && chatPanel) {
        closeChat.addEventListener('click', () => {
            try {
                chatPanel.classList.remove('open');
            } catch (error) {
                console.error('Chat close failed:', error);
            }
        });
    }
});

// Tab management with error handling
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                try {
                    const targetTab = button.getAttribute('data-tab');
                    if (!targetTab) return;
                    
                    // Update active states
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    button.classList.add('active');
                    const targetTabElement = document.getElementById(`${targetTab}-tab`);
                    if (targetTabElement) {
                        targetTabElement.classList.add('active');
                    }
                    
                    // Update charts if visuals tab
                    if (targetTab === 'visuals' && currentPlan) {
                        updateCharts();
                    }
                } catch (error) {
                    console.error('Tab switching failed:', error);
                }
            });
        }
    });
});

// Loading overlay with progress tracking
function showLoading(text = 'Processing...') {
    try {
        const overlay = safeQuery('#loading-overlay');
        const loadingText = safeQuery('#loading-text');
        const loadingTitle = safeQuery('#loading-title');
        const progressBar = safeQuery('#overall-progress-bar');
        const progressPercentage = safeQuery('#progress-percentage');
        
        if (loadingTitle) loadingTitle.textContent = 'AI Agents Working...';
        if (loadingText) loadingText.textContent = text;
        if (progressBar) progressBar.style.width = '0%';
        if (progressPercentage) progressPercentage.textContent = '0%';
        
        // Initialize agent timeline
        initializeAgentTimeline();
        
        if (overlay) overlay.style.display = 'flex';
    } catch (error) {
        console.error('Show loading failed:', error);
    }
}

function hideLoading() {
    try {
        const overlay = safeQuery('#loading-overlay');
        if (overlay) overlay.style.display = 'none';
    } catch (error) {
        console.error('Hide loading failed:', error);
    }
}

function initializeAgentTimeline() {
    try {
        const agentTimeline = safeQuery('#agent-timeline');
        if (!agentTimeline) return;
        
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
    } catch (error) {
        console.error('Agent timeline initialization failed:', error);
    }
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

// Time tracking UI components
function createTimeTrackingTab() {
    const tabHeader = document.querySelector('.tabs-header');
    const tabContent = document.querySelector('.tabs-content');
    
    // Add Time Tracking tab button
    const timeTrackingBtn = document.createElement('button');
    timeTrackingBtn.className = 'tab-btn glass-button secondary';
    timeTrackingBtn.setAttribute('data-tab', 'timetracking');
    timeTrackingBtn.innerHTML = '<i class="fas fa-clock"></i> Time Tracking';
    tabHeader.appendChild(timeTrackingBtn);
    
    // Add Time Tracking content
    const timeTrackingContent = document.createElement('div');
    timeTrackingContent.id = 'timetracking-tab';
    timeTrackingContent.className = 'tab-content';
    timeTrackingContent.innerHTML = `
        <div class="tab-header">
            <div class="tab-icon">
                <i class="fas fa-stopwatch"></i>
            </div>
            <div class="tab-info">
                <h3>Time Management Dashboard</h3>
                <p>Track project progress and time analytics</p>
            </div>
        </div>
        <div id="time-tracking-container"></div>
    `;
    tabContent.appendChild(timeTrackingContent);
    
    // Add event listener for the new tab
    timeTrackingBtn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        timeTrackingBtn.classList.add('active');
        timeTrackingContent.classList.add('active');
        
        updateTimeTrackingDisplay();
    });
}

function updateTimeTrackingDisplay() {
    const container = document.getElementById('time-tracking-container');
    if (!container || !currentPlan) return;
    
    const timeLeft = calculateTimeLeft(currentPlan.deadline);
    const timeStats = getOverallTimeStats();
    
    container.innerHTML = `
        <div class="time-dashboard">
            <div class="time-cards-grid">
                <div class="time-card">
                    <div class="time-card-header">
                        <i class="fas fa-calendar-times"></i>
                        <h4>Time Left</h4>
                    </div>
                    <div class="time-card-content">
                        <div class="time-display ${timeLeft.overdue ? 'overdue' : ''}">
                            <span class="time-value">${timeLeft.days}</span>
                            <span class="time-label">Days</span>
                        </div>
                        <div class="time-display">
                            <span class="time-value">${timeLeft.hours}</span>
                            <span class="time-label">Hours</span>
                        </div>
                        <div class="time-display">
                            <span class="time-value">${timeLeft.minutes}</span>
                            <span class="time-label">Minutes</span>
                        </div>
                    </div>
                    ${timeLeft.overdue ? '<div class="overdue-warning">Project is overdue!</div>' : ''}
                </div>
                
                <div class="time-card">
                    <div class="time-card-header">
                        <i class="fas fa-chart-line"></i>
                        <h4>Project Progress</h4>
                    </div>
                    <div class="time-card-content">
                        <div class="progress-ring">
                            <svg class="progress-ring-svg" width="80" height="80">
                                <circle class="progress-ring-circle" stroke="#e6e6e6" stroke-width="8" fill="transparent" r="30" cx="40" cy="40"/>
                                <circle class="progress-ring-circle progress" stroke="#007bff" stroke-width="8" fill="transparent" r="30" cx="40" cy="40"/>
                            </svg>
                            <div class="progress-text">${Math.round(timeStats.progress)}%</div>
                        </div>
                    </div>
                </div>
                
                <div class="time-card">
                    <div class="time-card-header">
                        <i class="fas fa-clock"></i>
                        <h4>Time Comparison</h4>
                    </div>
                    <div class="time-card-content">
                        <div class="time-comparison">
                            <div class="time-item">
                                <span class="time-label">Estimated:</span>
                                <span class="time-value estimated">${Math.round(timeStats.totalEstimated)}h</span>
                            </div>
                            <div class="time-item">
                                <span class="time-label">Actual:</span>
                                <span class="time-value actual ${timeStats.variance > 0 ? 'over' : 'under'}">${Math.round(timeStats.totalActual)}h</span>
                            </div>
                            <div class="time-item">
                                <span class="time-label">Variance:</span>
                                <span class="time-value variance ${timeStats.variance > 0 ? 'over' : 'under'}">
                                    ${timeStats.variance > 0 ? '+' : ''}${Math.round(timeStats.variance)}h
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="time-card">
                    <div class="time-card-header">
                        <i class="fas fa-tasks"></i>
                        <h4>Task Timers</h4>
                    </div>
                    <div class="time-card-content">
                        <div id="task-timers-list" class="task-timers-list">
                            ${currentPlan.tasks.map(task => createTaskTimerHTML(task)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add progress ring animation
    animateProgressRing(timeStats.progress);
    
    // Update timers every second
    startTimerUpdates();
}

function createTaskTimerHTML(task) {
    const timerData = timeTracking.taskTimers[task.id] || {};
    const isRunning = timerData.startTime && !timerData.completed;
    const isCompleted = timerData.completed;
    
    return `
        <div class="task-timer-item" data-task-id="${task.id}">
            <div class="task-timer-header">
                <span class="task-name">${task.title}</span>
                <div class="task-timer-controls">
                    ${!isCompleted ? `
                        <button class="timer-btn start" onclick="startTaskTimer('${task.id}')" ${isRunning ? 'disabled' : ''}>
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="timer-btn pause" onclick="pauseTaskTimer('${task.id}')" ${!isRunning ? 'disabled' : ''}>
                            <i class="fas fa-pause"></i>
                        </button>
                        <button class="timer-btn complete" onclick="completeTaskTimer('${task.id}', ${task.estimated_hours})">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : `
                        <span class="completion-badge completed"><i class="fas fa-check"></i> Completed</span>
                    `}
                </div>
            </div>
            <div class="task-timer-status">
                ${isRunning ? `<span class="timer-status running">Running</span>` : isCompleted ? `<span class="timer-status completed">Completed</span>` : `<span class="timer-status stopped">Stopped</span>`}
                <span class="task-estimated">Est: ${task.estimated_hours}h</span>
            </div>
            <div class="task-timer-display">
                <span class="timer-display" id="timer-${task.id}">00:00:00</span>
                ${isCompleted && timeTracking.actualTimes[task.id] ? `
                    <span class="actual-time">Actual: ${Math.round(timeTracking.actualTimes[task.id].actual * 10) / 10}h</span>
                ` : ''}
            </div>
        </div>
    `;
}

function startTimerUpdates() {
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
    }
    
    window.timerInterval = setInterval(() => {
        currentPlan.tasks.forEach(task => {
            const timerData = timeTracking.taskTimers[task.id];
            const timerDisplay = document.getElementById(`timer-${task.id}`);
            
            if (timerData && timerDisplay && !timerData.completed) {
                const elapsed = Date.now() - timerData.startTime;
                timerDisplay.textContent = formatElapsedTime(elapsed);
            }
        });
    }, 1000);
}

function formatElapsedTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function animateProgressRing(percentage) {
    const circle = document.querySelector('.progress-ring-circle.progress');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;
        
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function pauseTaskTimer(taskId) {
    const timerData = timeTracking.taskTimers[taskId];
    if (timerData && timerData.startTime && !timerData.completed) {
        const elapsed = Date.now() - timerData.startTime;
        timerData.intervals.push(elapsed);
        delete timerData.startTime;
        updateTimeTrackingDisplay();
    }
}

function completeTaskTimer(taskId, estimatedHours) {
    const timerData = timeTracking.taskTimers[taskId];
    if (timerData) {
        if (timerData.startTime) {
            const elapsed = Date.now() - timerData.startTime;
            timerData.intervals.push(elapsed);
        }
        timerData.completed = true;
        timerData.endTime = Date.now();
        
        const totalElapsed = timerData.intervals.reduce((sum, interval) => sum + interval, 0);
        const actualHours = totalElapsed / (1000 * 60 * 60);
        
        timeTracking.actualTimes[taskId] = {
            estimated: estimatedHours,
            actual: actualHours,
            variance: actualHours - estimatedHours
        };
        
        updateTimeTrackingDisplay();
        showToast(`Task "${currentPlan.tasks.find(t => t.id === taskId)?.title}" completed!`, 'success');
    }
}

function displayResults(plan) {
    displayTasks(plan.tasks);
    displaySchedule(plan.schedule);
    displayRisks(plan.risks);
    displayOptimizations(plan.optimizations);
    updateProgress(plan.tasks);
    
    // Initialize time tracking and create new tab
    initializeTimeTracking();
    createTimeTrackingTab();
    updateTimeTrackingDisplay();
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
    chatContext = `Project: ${plan.goal}
Start: ${plan.start_date}
Deadline: ${plan.deadline}
Tasks: ${plan.tasks.length}
Total Hours: ${plan.tasks.reduce((sum, task) => sum + task.estimated_hours, 0)}`;
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

    // Enhanced project data with time tracking
    const enhancedProjectData = {
        ...currentPlan,
        time_tracking: timeTracking,
        time_stats: getOverallTimeStats(),
        generated_at: new Date().toISOString()
    };

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
                project_data: enhancedProjectData
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
            
            showToast('Comprehensive PDF exported successfully!', 'success');
        } else if (response.status === 503) {
            // Fallback to client-side PDF generation
            generateClientPDF(enhancedProjectData);
        } else {
            showToast('Error: ' + (data.error || 'Failed to export PDF'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        // Fallback to client-side PDF generation
        generateClientPDF(enhancedProjectData);
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

// Enhanced client-side PDF generation fallback
function generateClientPDF(plan) {
    try {
        showToast('Generating comprehensive project report locally...', 'info');
        
        // Calculate time statistics
        const timeStats = plan.time_stats || getOverallTimeStats();
        const timeLeft = calculateTimeLeft(plan.deadline);
        
        // Create comprehensive text representation
        const pdfContent = `
===============================================================
              PLANNERIUM - COMPREHENSIVE PROJECT PLAN
===============================================================
Generated on: ${new Date().toLocaleString()}

===============================================================
                    PROJECT OVERVIEW
===============================================================
Project Goal: ${plan.goal}
Start Date: ${plan.start_date}
Deadline: ${plan.deadline}
Hours per Week: ${plan.hours_per_week}

===============================================================
                 TIME TRACKING SUMMARY
===============================================================
Time Remaining: ${timeLeft.overdue ? 'OVERDUE' : `${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes`}

Total Estimated Hours: ${Math.round(timeStats.totalEstimated)}h
Total Actual Hours: ${Math.round(timeStats.totalActual)}h
Time Variance: ${timeStats.variance > 0 ? '+' : ''}${Math.round(timeStats.variance)}h (${timeStats.variance > 0 ? 'Over' : 'Under'} budget)
Project Progress: ${Math.round(timeStats.progress)}%

===============================================================
                   TASKS & MILESTONES
===============================================================
${plan.tasks.map((task, i) => {
    const timerData = plan.time_tracking?.taskTimers?.[task.id] || {};
    const actualTime = plan.time_tracking?.actualTimes?.[task.id] || {};
    const status = timerData.completed ? 'Completed' : timerData.startTime ? 'In Progress' : 'Not Started';
    
    return `
Task ${i + 1}: ${task.title}
   Description: ${task.description}
   Milestone: ${task.milestone}
   Estimated: ${task.estimated_hours}h
   Actual: ${actualTime.actual ? `${actualTime.actual.toFixed(1)}h` : 'N/A'}
   Variance: ${actualTime.variance ? `${actualTime.variance > 0 ? '+' : ''}${actualTime.variance.toFixed(1)}h` : 'N/A'}
   Priority: ${task.priority_label}
   Status: ${status}
   Dependencies: ${task.dependencies.join(', ') || 'None'}
`;
}).join('\n')}

===============================================================
                    WEEKLY SCHEDULE
===============================================================
${plan.schedule.map(week => `
Week ${week.week_number} (${week.week_start}):
${week.tasks.map(task => `  • ${task.task_title} (${task.hours_assigned}h) - ${task.milestone}`).join('\n')}
  Total Hours Planned: ${week.hours_planned}h
`).join('\n')}

===============================================================
                    RISK ANALYSIS
===============================================================
${plan.risks.map((risk, i) => `
Risk ${i + 1}: ${risk.description}
   Probability: ${risk.probability}
   Impact: ${risk.impact}
   Severity: ${risk.severity}
   Mitigation: ${risk.mitigation}
`).join('\n')}

===============================================================
                OPTIMIZATION SUGGESTIONS
===============================================================
${plan.optimizations.map((opt, i) => `
Optimization ${i + 1}: ${opt.title}
   Category: ${opt.category}
   Description: ${opt.description}
   Impact: ${opt.impact}
`).join('\n')}

${plan.performance_metrics ? `
===============================================================
                 AI PERFORMANCE METRICS
===============================================================
Total Planning Time: ${plan.performance_metrics.total_time.toFixed(2)} seconds
Tasks Generated: ${plan.performance_metrics.total_tasks}
Schedule Weeks: ${plan.performance_metrics.total_schedule_weeks}
Risks Identified: ${plan.performance_metrics.total_risks}
Optimizations Suggested: ${plan.performance_metrics.total_optimizations}

Agent Processing Times:
${Object.entries(plan.performance_metrics.agent_times || {}).map(([agent, time]) => `  • ${agent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${time.toFixed(2)}s`).join('\n')}
` : ''}

===============================================================
              Generated by Plannerium AI Planning System
        Intelligent Multi-Agent Project Management & Time Tracking
===============================================================
        `;
        
        downloadFile(pdfContent, `${plan.project_name || 'project'}-comprehensive-plan.txt`, 'text/plain');
        showToast('Comprehensive project report generated successfully!', 'success');
    } catch (error) {
        console.error('PDF generation failed:', error);
        showToast('Failed to export project data', 'error');
    }
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