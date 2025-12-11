// Global variables
let currentPlan = null;
let currentProjectName = '';
let currentProjectId = null;
let charts = {};
let chatContext = '';
let timeTracking = {
    taskTimers: {},
    projectStartTime: null,
    actualTimes: {},
    progressData: {}
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initGamification();
    initCyberMode();
    initTheme();
    
    // Check for project ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    if (projectId) {
        loadProjectFromURL(projectId);
    }
});

function loadProjectFromURL(projectId) {
    auth.onAuthStateChanged(user => {
        if (user) {
            const projectRef = database.ref('users/' + user.uid + '/projects/' + projectId);
            projectRef.once('value', (snapshot) => {
                const project = snapshot.val();
                if (project) {
                    currentPlan = project;
                    currentProjectId = projectId;
                    currentProjectName = project.project_name || 'Untitled Project';
                    
                    // Populate inputs
                    if (document.getElementById('goal')) document.getElementById('goal').value = project.goal || '';
                    if (document.getElementById('start-date')) document.getElementById('start-date').value = project.start_date || '';
                    if (document.getElementById('deadline')) document.getElementById('deadline').value = project.deadline || '';
                    if (document.getElementById('hours-per-week')) document.getElementById('hours-per-week').value = project.hours_per_week || 20;
                    
                    // Render Plan
                    renderPlan(project);
                    
                    // Show Results Section
                    document.getElementById('results-section').style.display = 'block';
                    scrollToSection('results-section');
                    
                    showToast('Project Loaded: ' + currentProjectName, 'success');
                } else {
                    showToast('Project not found', 'error');
                }
            });
        }
    });
}
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

// --- GAMIFICATION & SETTINGS LOGIC ---

function initGamification() {
    if (typeof auth === 'undefined' || typeof database === 'undefined') return;

    auth.onAuthStateChanged(user => {
        if (user) {
            const xpRef = database.ref('users/' + user.uid + '/profile/xp');
            xpRef.on('value', (snapshot) => {
                const xp = snapshot.val() || 0;
                const level = Math.floor(xp / 100) + 1; // Start at level 1
                const progress = xp % 100; // 0-99

                // Update UI
                const levelDisplay = document.getElementById('user-level-display');
                const progressBar = document.getElementById('xp-progress-bar');

                if (levelDisplay) levelDisplay.textContent = 'LVL ' + level;
                if (progressBar) progressBar.style.width = progress + '%';
                
                // Update Level in DB if changed (optional, but good for persistence)
                database.ref('users/' + user.uid + '/profile/level').set(level);
            });
        }
    });
}

function initCyberMode() {
    const isCyberMode = localStorage.getItem('cyberMode') === 'true';
    if (isCyberMode) {
        document.body.classList.add('scanlines');
    }
}



// --- EXPORT LOGIC ---
document.getElementById('export-ics')?.addEventListener('click', async () => {
    if (!currentPlan) {
        showToast('No plan to export!', 'warning');
        return;
    }
    
    try {
        showToast('Generating ICS...', 'info');
        const response = await fetch('/api/export_ics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_data: currentPlan })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        // Download file
        const blob = new Blob([data.ics_content], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('ICS Export Successful!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Export failed: ' + error.message, 'error');
    }
});

// --- PLAN GENERATION LOGIC (Task 4) ---
document.getElementById('generate-plan')?.addEventListener('click', async () => {
    const goal = document.getElementById('goal').value;
    const startDate = document.getElementById('start-date').value;
    const deadline = document.getElementById('deadline').value;
    const hoursPerWeek = document.getElementById('hours-per-week').value;
    
    if (!goal || !startDate || !deadline) {
        showToast('Please fill in all fields', 'warning');
        return;
    }
    
    // Start Cinematic Sequence
    const animationPromise = Features.startAgentSequence();

    // Start API Call
    const apiPromise = fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            goal,
            start_date: startDate,
            deadline,
            hours_per_week: hoursPerWeek
        })
    }).then(response => response.json());

    try {
        // Wait for both Animation and API
        const [_, data] = await Promise.all([animationPromise, apiPromise]);
        
        if (data.error) throw new Error(data.error);
        
        currentPlan = data;
        renderPlan(data);
        
        // Success Transition
        Features.finishAgentSequence(true);
        
        setTimeout(() => {
            Features.closeAgentOverlay();
            document.getElementById('results-section').style.display = 'block';
            scrollToSection('results-section');
            showToast('Plan Generated Successfully!', 'success');
        }, 1500);
        
    } catch (error) {
        console.error('Planning failed:', error);
        Features.finishAgentSequence(false, error.message);
        showToast('Planning failed: ' + error.message, 'error');
    }
});

function renderPlan(plan) {
    const tasksContainer = document.getElementById('tasks-container');
    if (tasksContainer) {
        tasksContainer.innerHTML = plan.tasks.map((t, index) => `
            <div class="task-card glass-card ${t.completed ? 'completed' : ''}" style="margin-bottom: 15px; padding: 15px; border-left: 4px solid ${t.completed ? '#0f0' : '#333'};">
                <div style="display:flex; justify-content:space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" class="task-checkbox" 
                               ${t.completed ? 'checked' : ''} 
                               onchange="toggleTaskCompletion(${index}, this.checked)"
                               style="accent-color: #0f0; width: 18px; height: 18px; cursor: pointer;">
                        <h4 style="margin: 0; text-decoration: ${t.completed ? 'line-through' : 'none'}; color: ${t.completed ? '#888' : '#fff'};">${t.title}</h4>
                    </div>
                    <span class="badge">${t.priority_label}</span>
                </div>
                <p style="margin-left: 28px; color: ${t.completed ? '#666' : '#aaa'};">${t.description}</p>
                <div class="task-meta" style="margin-top: 10px; margin-left: 28px; font-size: 0.9em; color: #888;">
                    <span><i class="fas fa-clock"></i> ${t.estimated_hours}h</span>
                    <span style="margin-left: 15px;"><i class="fas fa-flag"></i> ${t.milestone}</span>
                </div>
            </div>
        `).join('');
    }
    
    // Update progress
    updateProgressUI();
    
    // Render Analytics
    renderProjectAnalytics();
}

function toggleTaskCompletion(index, isCompleted) {
    if (!currentPlan || !currentPlan.tasks[index]) return;
    
    currentPlan.tasks[index].completed = isCompleted;
    
    // Update UI immediately
    renderPlan(currentPlan);
    
    if (isCompleted) {
        showToast('+XP TASK COMPLETED', 'success');
        // Trigger gamification update if available
        if (typeof updateXP === 'function') updateXP(50); 
    }

    // Update Firebase
    if (currentProjectId && auth.currentUser) {
        const updates = {};
        updates[`users/${auth.currentUser.uid}/projects/${currentProjectId}/tasks/${index}/completed`] = isCompleted;
        
        // Recalculate progress
        const total = currentPlan.tasks.length;
        const completed = currentPlan.tasks.filter(t => t.completed).length;
        const progress = Math.round((completed / total) * 100);
        updates[`users/${auth.currentUser.uid}/projects/${currentProjectId}/progress`] = progress;
        
        database.ref().update(updates);
    }
}

function updateProgressUI() {
    if (!currentPlan || !currentPlan.tasks) return;
    const total = currentPlan.tasks.length;
    const completed = currentPlan.tasks.filter(t => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const text = document.getElementById('progress-text');
    // Try to find the progress bar in the results section
    const resultBar = document.querySelector('#tasks-tab .progress-bar > div') || document.getElementById('overall-progress');
    
    if (text) text.textContent = progress + '%';
    if (resultBar) resultBar.style.width = progress + '%';
}

function renderProjectAnalytics() {
    // Find container (Visuals tab)
    const container = document.getElementById('visuals-tab');
    if (!container) return;
    
    // Check if analytics section exists
    let analyticsSection = document.getElementById('project-analytics-section');
    if (!analyticsSection) {
        analyticsSection = document.createElement('div');
        analyticsSection.id = 'project-analytics-section';
        analyticsSection.className = 'glass-card';
        analyticsSection.style.marginTop = '20px';
        analyticsSection.innerHTML = '<h3><i class="fas fa-chart-pie"></i> REAL-TIME PROJECT ANALYTICS</h3><div class="analytics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;"></div>';
        // Insert at the top of visuals tab
        container.insertBefore(analyticsSection, container.firstChild);
    }
    
    const grid = analyticsSection.querySelector('.analytics-grid');
    
    // Calculate Metrics
    const totalTasks = currentPlan.tasks.length;
    const completedTasks = currentPlan.tasks.filter(t => t.completed).length;
    
    const totalHours = currentPlan.tasks.reduce((sum, t) => sum + (parseInt(t.estimated_hours) || 0), 0);
    const completedHours = currentPlan.tasks.filter(t => t.completed).reduce((sum, t) => sum + (parseInt(t.estimated_hours) || 0), 0);
    
    const risks = currentPlan.risks || [];
    const highRisks = risks.filter(r => (r.severity || '').toLowerCase() === 'high').length;
    const riskScore = Math.max(0, 100 - (highRisks * 10)); // Simple score
    
    grid.innerHTML = `
        <div class="stat-card" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.8rem; color: #888;">COMPLETION VELOCITY</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #0f0;">${completedTasks}/${totalTasks}</div>
            <div style="font-size: 0.7rem; color: #666;">TASKS</div>
        </div>
        <div class="stat-card" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.8rem; color: #888;">EFFICIENCY RATE</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #0ff;">${totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0}%</div>
            <div style="font-size: 0.7rem; color: #666;">HOURS BURNED</div>
        </div>
        <div class="stat-card" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.8rem; color: #888;">RISK EXPOSURE</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: ${riskScore < 50 ? '#f00' : '#ff0'};">${100 - riskScore}%</div>
            <div style="font-size: 0.7rem; color: #666;">${highRisks} HIGH SEVERITY</div>
        </div>
    `;
}

// --- CURSOR LOGIC FOR MODALS ---
document.addEventListener('mouseover', (e) => {
    const target = e.target;
    const isModal = target.closest('.modal-content') || target.closest('.auth-container') || target.closest('.login-container');
    
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');
    
    if (isModal) {
        if (dot) dot.style.opacity = '0';
        if (outline) outline.style.opacity = '0';
    } else {
        if (dot) dot.style.opacity = '1';
        if (outline) outline.style.opacity = '1';
    }
});
