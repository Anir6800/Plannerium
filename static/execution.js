// Mission Execution Interface - Real-time Tactical Operations
// Direct Firebase binding with no local state variables

const Execution = {
    projectId: null,
    projectRef: null,
    projectData: null,
    activeTaskIndex: null,
    currentFilter: 'all',
    taskTimers: {},

    init: function(projectId) {
        this.projectId = projectId;

        // Check authentication
        auth.onAuthStateChanged(user => {
            if (user) {
                this.setupFirebaseListener();
                this.setupEventListeners();
                this.setActiveProjectState();
            } else {
                window.location.href = '/login';
            }
        });
    },

    setupFirebaseListener: function() {
        const user = auth.currentUser;
        if (!user) return;

        // Direct binding to Firebase - no local variables
        this.projectRef = database.ref('users/' + user.uid + '/projects/' + this.projectId);

        // Real-time listener for all project data
        this.projectRef.on('value', (snapshot) => {
            const data = snapshot.val();

            if (!data) {
                this.showError('PROJECT NOT FOUND');
                return;
            }

            // Validate data structure
            if (!data.tasks || !Array.isArray(data.tasks)) {
                this.showError('INVALID PROJECT DATA STRUCTURE');
                return;
            }

            this.projectData = data;
            this.renderProject();
            this.updateProgress();
        });
    },

    setupEventListeners: function() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Task list clicks
        document.getElementById('task-list').addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const index = parseInt(taskItem.dataset.index);
                this.selectTask(index);
            }
        });

        // Task checkbox changes
        document.getElementById('task-list').addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const index = parseInt(e.target.closest('.task-item').dataset.index);
                const completed = e.target.checked;
                this.updateTaskCompletion(index, completed);
            }
        });
    },

    setActiveProjectState: function() {
        // Set global active project for sidebar indicator
        window.currentProjectId = this.projectId;
        this.updateSidebarIndicator();
    },

    updateSidebarIndicator: function() {
        // Update sidebar to show LIVE indicator
        const missionControlLink = document.querySelector('a[href*="dashboard"]');
        if (missionControlLink) {
            // Remove existing indicator
            const existing = missionControlLink.querySelector('.live-indicator');
            if (existing) existing.remove();

            // Add new indicator
            const indicator = document.createElement('span');
            indicator.className = 'live-indicator';
            indicator.innerHTML = ' <span class="live-dot">●</span>';
            indicator.style.cssText = `
                color: #0f0;
                animation: pulse 2s infinite;
            `;
            missionControlLink.appendChild(indicator);
        }
    },

    renderProject: function() {
        if (!this.projectData) return;

        // Update project title
        document.getElementById('project-title').textContent = this.projectData.project_name || 'UNTITLED MISSION';

        // Render task list
        this.renderTaskList();

        // Clear inspector if no active task
        if (this.activeTaskIndex === null) {
            this.clearInspector();
        }
    },

    renderTaskList: function() {
        const taskList = document.getElementById('task-list');
        const tasks = this.projectData.tasks;

        if (!tasks || tasks.length === 0) {
            taskList.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">NO TASKS FOUND</div>';
            return;
        }

        let filteredTasks = tasks;
        if (this.currentFilter === 'remaining') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        }

        taskList.innerHTML = filteredTasks.map((task, originalIndex) => {
            const isActive = originalIndex === this.activeTaskIndex;
            const statusClass = task.completed ? 'completed' :
                              (this.taskTimers[originalIndex] && this.taskTimers[originalIndex].active) ? 'active' : 'pending';

            return `
                <div class="task-item ${isActive ? 'active' : ''} status-${statusClass}" data-index="${originalIndex}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-title">${task.title || 'Untitled Task'}</div>
                        <div class="task-meta">
                            <span><i class="fas fa-clock"></i> ${task.estimated_hours || 0}h</span>
                            <span><i class="fas fa-flag"></i> ${task.priority_label || 'Medium'}</span>
                            <span><i class="fas fa-exclamation-triangle"></i> ${task.risk_score || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    setFilter: function(filter) {
        this.currentFilter = filter;

        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderTaskList();
    },

    selectTask: function(index) {
        this.activeTaskIndex = index;
        this.renderTaskInspector();
        this.renderTaskList(); // Re-render to show active state
    },

    renderTaskInspector: function() {
        const inspector = document.getElementById('task-inspector');
        const content = document.getElementById('inspector-content');

        if (this.activeTaskIndex === null || !this.projectData.tasks[this.activeTaskIndex]) {
            this.clearInspector();
            return;
        }

        const task = this.projectData.tasks[this.activeTaskIndex];
        const isActive = this.taskTimers[this.activeTaskIndex] && this.taskTimers[this.activeTaskIndex].active;

        content.innerHTML = `
            <div class="inspector-header">
                <div class="inspector-title">${task.title || 'Untitled Task'}</div>
                <div style="color: #666; font-size: 0.8rem;">TASK ${this.activeTaskIndex + 1} OF ${this.projectData.tasks.length}</div>
            </div>

            <div class="vital-stats">
                <div class="stat-item">
                    <div class="stat-label">ESTIMATED HOURS</div>
                    <div class="stat-value">${task.estimated_hours || 0}h</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">PRIORITY</div>
                    <div class="stat-value">${task.priority_label || 'Medium'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">RISK LEVEL</div>
                    <div class="stat-value">${this.getRiskLabel(task.risk_score || 0)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">STATUS</div>
                    <div class="stat-value">${task.completed ? 'COMPLETED' : 'ACTIVE'}</div>
                </div>
            </div>

            <div class="dependencies">
                <h4><i class="fas fa-link"></i> DEPENDENCIES</h4>
                <ul class="dependency-list">
                    ${this.renderDependencies(task)}
                </ul>
            </div>

            <div class="action-deck">
                <button class="action-btn ${isActive ? 'danger' : 'primary'}" onclick="Execution.toggleTimer(${this.activeTaskIndex})">
                    <i class="fas fa-${isActive ? 'stop' : 'play'}"></i>
                    ${isActive ? 'STOP TIMER' : 'START TIMER'}
                </button>
                <button class="action-btn primary" onclick="Execution.markComplete(${this.activeTaskIndex})">
                    <i class="fas fa-check"></i>
                    MARK COMPLETE
                </button>
                <button class="action-btn" onclick="Execution.flagIssue(${this.activeTaskIndex})">
                    <i class="fas fa-flag"></i>
                    FLAG ISSUE
                </button>
            </div>
        `;

        // Slide in inspector
        inspector.classList.add('active');
    },

    renderDependencies: function(task) {
        if (!task.dependencies || task.dependencies.length === 0) {
            return '<li class="dependency-item">No dependencies</li>';
        }

        return task.dependencies.map(dep => {
            const depTask = this.projectData.tasks.find(t => t.id === dep);
            return `<li class="dependency-item">${depTask ? depTask.title : dep}</li>`;
        }).join('');
    },

    clearInspector: function() {
        const inspector = document.getElementById('task-inspector');
        const content = document.getElementById('inspector-content');

        content.innerHTML = `
            <div style="text-align: center; color: #666; padding: 40px;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 20px;"></i>
                <div>SELECT A TASK TO VIEW DETAILS</div>
            </div>
        `;

        inspector.classList.remove('active');
        this.activeTaskIndex = null;
    },

    updateTaskCompletion: function(index, completed) {
        if (!auth.currentUser) return;

        // Immediate UI update
        this.projectData.tasks[index].completed = completed;

        // Firebase sync
        const updates = {};
        updates[`users/${auth.currentUser.uid}/projects/${this.projectId}/tasks/${index}/completed`] = completed;

        // Recalculate progress
        const total = this.projectData.tasks.length;
        const completedCount = this.projectData.tasks.filter(t => t.completed).length;
        const progress = Math.round((completedCount / total) * 100);
        updates[`users/${auth.currentUser.uid}/projects/${this.projectId}/progress`] = progress;

        database.ref().update(updates);

        // Success animation and sound
        if (completed) {
            this.playSuccessSound();
            this.showSuccessAnimation(index);
        }

        // Update progress display
        this.updateProgress();
    },

    toggleTimer: function(index) {
        if (this.taskTimers[index] && this.taskTimers[index].active) {
            this.stopTimer(index);
        } else {
            this.startTimer(index);
        }
    },

    startTimer: function(index) {
        if (!this.taskTimers[index]) {
            this.taskTimers[index] = {
                startTime: Date.now(),
                active: true,
                elapsed: 0
            };
        } else {
            this.taskTimers[index].active = true;
            this.taskTimers[index].startTime = Date.now() - (this.taskTimers[index].elapsed || 0);
        }

        this.renderTaskList();
        this.renderTaskInspector();
    },

    stopTimer: function(index) {
        if (this.taskTimers[index]) {
            this.taskTimers[index].elapsed = Date.now() - this.taskTimers[index].startTime;
            this.taskTimers[index].active = false;

            // Sync actual time to Firebase
            const actualHours = this.taskTimers[index].elapsed / (1000 * 60 * 60);
            this.updateActualTime(index, actualHours);
        }

        this.renderTaskList();
        this.renderTaskInspector();
    },

    updateActualTime: function(index, actualHours) {
        if (!auth.currentUser) return;

        const updates = {};
        updates[`users/${auth.currentUser.uid}/projects/${this.projectId}/tasks/${index}/actual_time`] = actualHours;

        database.ref().update(updates);
    },

    markComplete: function(index) {
        const checkbox = document.querySelector(`.task-item[data-index="${index}"] .task-checkbox`);
        if (checkbox) {
            checkbox.checked = true;
            this.updateTaskCompletion(index, true);
        }
    },

    flagIssue: function(index) {
        // For now, just show a toast. Could be expanded to create issues in Firebase
        showToast('ISSUE FLAGGED - NOTIFICATION SENT', 'warning');
    },

    updateProgress: function() {
        if (!this.projectData || !this.projectData.tasks) return;

        const total = this.projectData.tasks.length;
        const completed = this.projectData.tasks.filter(t => t.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('mission-progress').style.width = progress + '%';
        document.getElementById('progress-text').textContent = progress + '%';
    },

    generateChecklist: function() {
        if (!this.projectData || !this.projectData.tasks) {
            showToast('NO TASKS TO EXPORT', 'warning');
            return;
        }

        const remainingTasks = this.projectData.tasks.filter(t => !t.completed);
        if (remainingTasks.length === 0) {
            showToast('ALL TASKS COMPLETED', 'success');
            return;
        }

        let checklist = `# ${this.projectData.project_name || 'Project'} - Field Checklist\n\n`;
        checklist += `Generated: ${new Date().toLocaleString()}\n\n`;
        checklist += `Remaining Tasks: ${remainingTasks.length}\n\n`;

        remainingTasks.forEach((task, index) => {
            checklist += `[ ] ${task.title} (${task.estimated_hours || 0}h)\n`;
            if (task.description) {
                checklist += `    ${task.description}\n`;
            }
            checklist += '\n';
        });

        // Download as markdown file
        const blob = new Blob([checklist], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.projectData.project_name || 'project'}_checklist.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('CHECKLIST GENERATED', 'success');
    },

    playSuccessSound: function() {
        const audio = document.getElementById('success-sound');
        if (audio && audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } else {
            // Fallback: create a simple beep sound
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(context.destination);

                oscillator.frequency.setValueAtTime(800, context.currentTime);
                oscillator.frequency.setValueAtTime(600, context.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.3, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);

                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.2);
            } catch (e) {
                console.log('Sound not available');
            }
        }
    },

    showSuccessAnimation: function(index) {
        const taskItem = document.querySelector(`.task-item[data-index="${index}"]`);
        if (taskItem) {
            taskItem.style.animation = 'none';
            setTimeout(() => {
                taskItem.style.animation = 'pulse 0.5s ease-in-out';
            }, 10);
        }
    },

    getRiskLabel: function(score) {
        if (score >= 7) return 'HIGH';
        if (score >= 4) return 'MEDIUM';
        return 'LOW';
    },

    showError: function(message) {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div>DATA CORRUPTION</div>
                <div style="font-size: 0.8rem; margin-top: 10px;">${message}</div>
                <button class="action-btn primary" style="margin-top: 20px;" onclick="window.location.href='/projects'">
                    RETURN TO DATA BANK
                </button>
            </div>
        `;
    },

    cleanup: function() {
        // Detach Firebase listeners
        if (this.projectRef) {
            this.projectRef.off();
        }

        // Clear active project state
        window.currentProjectId = null;
        this.updateSidebarIndicator();
    }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Execution.cleanup();
});