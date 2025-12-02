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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initGamification();
    initCyberMode();
    initTheme();
});

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
    
    // Show Loading Overlay with Terminal Log
    const overlay = document.getElementById('loading-overlay');
    const loadingTitle = document.getElementById('loading-title');
    const loadingText = document.getElementById('loading-text');
    const agentStatus = document.getElementById('current-agent');
    const agentTimeline = document.getElementById('agent-timeline');
    
    overlay.style.display = 'flex';
    loadingTitle.textContent = 'INITIALIZING SYSTEM...';
    loadingText.textContent = 'Establishing secure connection to agent swarm...';
    agentTimeline.innerHTML = ''; // Clear previous logs
    
    // Terminal Log Animation Helper
    const addLog = (message, type = 'info') => {
        const logLine = document.createElement('div');
        logLine.className = `log-line log-${type}`;
        logLine.style.fontFamily = "'Fira Code', monospace";
        logLine.style.marginBottom = "5px";
        logLine.style.opacity = "0";
        logLine.innerHTML = `<span style="color: #0f0;">></span> ${message}`;
        agentTimeline.appendChild(logLine);
        
        // Typewriter effect or fade in
        setTimeout(() => {
            logLine.style.transition = "opacity 0.3s";
            logLine.style.opacity = "1";
        }, 50);
        
        // Auto scroll
        agentTimeline.scrollTop = agentTimeline.scrollHeight;
    };
    
    // Simulation of agents
    const steps = [
        { msg: "[SYSTEM] Initializing Multi-Agent Swarm...", delay: 500 },
        { msg: "[AGENT_01] Decomposition... OK", delay: 1500 },
        { msg: "[AGENT_02] Risk Analysis... SCANNING", delay: 2500 },
        { msg: "[AGENT_03] Optimization... COMPLETE", delay: 3500 },
        { msg: "[SYSTEM] Compiling Final Plan...", delay: 4500 }
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex < steps.length) {
            addLog(steps[stepIndex].msg);
            agentStatus.textContent = steps[stepIndex].msg.split(']')[0].replace('[', '') + ' ACTIVE';
            stepIndex++;
        }
    }, 1000);

    try {
        const response = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                goal,
                start_date: startDate,
                deadline,
                hours_per_week: hoursPerWeek
            })
        });
        
        const data = await response.json();
        clearInterval(interval);
        
        if (data.error) throw new Error(data.error);
        
        currentPlan = data;
        renderPlan(data);
        
        // Hide overlay
        setTimeout(() => {
            overlay.style.display = 'none';
            document.getElementById('results-section').style.display = 'block';
            scrollToSection('results-section');
            showToast('Plan Generated Successfully!', 'success');
        }, 1000);
        
    } catch (error) {
        clearInterval(interval);
        console.error('Planning failed:', error);
        showToast('Planning failed: ' + error.message, 'error');
        overlay.style.display = 'none';
    }
});

function renderPlan(plan) {
    const tasksContainer = document.getElementById('tasks-container');
    if (tasksContainer) {
        tasksContainer.innerHTML = plan.tasks.map(t => `
            <div class="task-card glass-card" style="margin-bottom: 15px; padding: 15px;">
                <div style="display:flex; justify-content:space-between;">
                    <h4>${t.title}</h4>
                    <span class="badge">${t.priority_label}</span>
                </div>
                <p>${t.description}</p>
                <div class="task-meta" style="margin-top: 10px; font-size: 0.9em; color: #888;">
                    <span><i class="fas fa-clock"></i> ${t.estimated_hours}h</span>
                    <span style="margin-left: 15px;"><i class="fas fa-flag"></i> ${t.milestone}</span>
                </div>
            </div>
        `).join('');
    }
    
    // Update progress
    document.getElementById('progress-text').textContent = '0%';
    document.getElementById('overall-progress').style.width = '0%';
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
