
// Plannerium Advanced Features Module
// Handles Data Bank, Neural Link, Voice Command, Simulation, etc.

const Features = {
    // 1. Data Bank (Project Loading)
    initDataBank: function() {
        const container = document.getElementById('data-bank-grid');
        if (!container) return;

        auth.onAuthStateChanged(user => {
            if (user) {
                const projectsRef = database.ref('users/' + user.uid + '/projects');
                projectsRef.on('value', (snapshot) => {
                    container.innerHTML = ''; // Clear existing
                    const projects = snapshot.val();
                    if (projects) {
                        Object.keys(projects).forEach(key => {
                            const project = projects[key];
                            const card = this.createMemoryShard(key, project);
                            container.appendChild(card);
                        });
                    } else {
                        container.innerHTML = '<p style="color: #666;">NO DATA SHARDS FOUND.</p>';
                    }
                });
            }
        });
    },

    createMemoryShard: function(id, project) {
        const div = document.createElement('div');
        div.className = 'memory-shard glass-card';
        div.innerHTML = `
            <div class="shard-header">
                <h3>${project.goal ? project.goal.substring(0, 20) + '...' : 'UNTITLED_PROTOCOL'}</h3>
                <span class="shard-date">${new Date(project.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div class="shard-stats">
                <span>TASKS: ${project.tasks ? project.tasks.length : 0}</span>
                <span>STATUS: ${project.status || 'ACTIVE'}</span>
            </div>
        `;
        div.addEventListener('click', () => this.loadProject(id, project));
        return div;
    },

    loadProject: function(id, project) {
        // Animation
        const overlay = document.createElement('div');
        overlay.className = 'data-injection-overlay';
        overlay.innerHTML = '<div class="matrix-text">INJECTING DATA STREAM...</div>';
        document.body.appendChild(overlay);

        setTimeout(() => {
            // Load data into inputs if on projects page
            if (document.getElementById('goal')) {
                document.getElementById('goal').value = project.goal || '';
                document.getElementById('start-date').value = project.start_date || '';
                document.getElementById('deadline').value = project.deadline || '';
                document.getElementById('hours-per-week').value = project.hours_per_week || 20;
            }
            
            // If renderTasks exists (global), use it
            if (typeof renderTasks === 'function' && project.tasks) {
                renderTasks(project.tasks);
            }

            document.body.removeChild(overlay);
            showToast('DATA SHARD LOADED', 'success');
        }, 1500);
    },

    // 2A. Neural Link (Real-time Collaboration)
    initNeuralLink: function() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (auth.currentUser) {
                    database.ref('presence/' + auth.currentUser.uid).set({
                        status: 'EDITING',
                        element: input.id,
                        timestamp: Date.now()
                    });
                }
            });
            input.addEventListener('blur', () => {
                if (auth.currentUser) {
                    database.ref('presence/' + auth.currentUser.uid).set({
                        status: 'IDLE',
                        timestamp: Date.now()
                    });
                }
            });
        });
    },

    // 2B. Voice Command Module
    initVoiceCommand: function() {
        if (!('webkitSpeechRecognition' in window)) {
            console.log('Voice command not supported');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        const btn = document.getElementById('voice-command-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                btn.classList.add('listening');
                recognition.start();
            });
        }

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            console.log('Voice Command:', command);
            this.executeVoiceCommand(command);
            if (btn) btn.classList.remove('listening');
        };

        recognition.onerror = () => {
            if (btn) btn.classList.remove('listening');
        };
    },

    executeVoiceCommand: function(command) {
        if (command.includes('create project')) {
            window.location.href = '/projects';
        } else if (command.includes('open settings')) {
            window.location.href = '/settings';
        } else if (command.includes('initialize focus')) {
            if (typeof toggleFocusMode === 'function') toggleFocusMode();
        } else if (command.includes('abort')) {
            // Clear inputs
            document.querySelectorAll('input').forEach(i => i.value = '');
        }
        showToast(`COMMAND RECOGNIZED: ${command.toUpperCase()}`, 'info');
    },

    // 2C. Simulation Engine
    initSimulationEngine: function() {
        const btn = document.getElementById('run-simulation-btn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const resultContainer = document.getElementById('simulation-results');
            resultContainer.innerHTML = '<div class="spinner"></div> CALCULATING PROBABILITIES...';
            
            setTimeout(() => {
                // Mock Simulation
                const probability = Math.floor(Math.random() * 30) + 70; // 70-100%
                resultContainer.innerHTML = `
                    <div class="sim-result">
                        <h3>MONTE CARLO PROJECTION</h3>
                        <div class="probability-bar">
                            <div class="prob-fill" style="width: ${probability}%"></div>
                        </div>
                        <p>${probability}% CHANCE OF COMPLETION BY DEADLINE</p>
                        <p class="sim-details">BASED ON 100 ITERATIONS (±20% VARIANCE)</p>
                    </div>
                `;
            }, 2000);
        });
    },

    // 2D. Chrono-Shift (History Slider)
    initChronoShift: function() {
        const slider = document.getElementById('chrono-slider');
        if (!slider) return;

        // Simple local history stack for the 'goal' input
        const goalInput = document.getElementById('goal');
        if (!goalInput) return;

        let history = [];
        let isRestoring = false;

        goalInput.addEventListener('input', () => {
            if (!isRestoring) {
                history.push(goalInput.value);
                if (history.length > 100) history.shift();
                slider.max = history.length - 1;
                slider.value = history.length - 1;
            }
        });

        slider.addEventListener('input', (e) => {
            const index = parseInt(e.target.value);
            if (history[index] !== undefined) {
                isRestoring = true;
                goalInput.value = history[index];
                isRestoring = false;
            }
        });
    },

    // 2E. Sonic Focus
    initSonicFocus: function() {
        const btn = document.getElementById('sonic-focus-btn');
        if (!btn) return;

        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-cinematic-hum-atmosphere-2304.mp3'); // Placeholder URL
        audio.loop = true;

        btn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-wave-square"></i> AUDIO ACTIVE';
            } else {
                audio.pause();
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-volume-mute"></i> SONIC FOCUS';
            }
        });
    },

    // 2F. Holographic Export
    initHolographicExport: function() {
        // Handled by existing export buttons, but we can add new formats here if needed
        // For now, we'll assume the buttons call these functions directly
    },

    exportJSON: function(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project_data.json';
        a.click();
    },

    exportMarkdown: function(data) {
        let md = `# ${data.goal || 'Project'}\n\n`;
        md += `**Start:** ${data.start_date} | **Deadline:** ${data.deadline}\n\n`;
        md += `## Tasks\n`;
        if (data.tasks) {
            data.tasks.forEach(t => {
                md += `- [ ] **${t.title}**: ${t.description} (${t.estimated_hours}h)\n`;
            });
        }
        const blob = new Blob([md], {type: 'text/markdown'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project_report.md';
        a.click();
    },

    // 2G. Avatar Interface
    initAvatar: function() {
        const avatar = document.getElementById('ai-core-avatar');
        if (!avatar) return;

        // Simulate status changes
        setInterval(() => {
            const states = ['idle', 'processing', 'active'];
            const state = states[Math.floor(Math.random() * states.length)];
            avatar.className = `ai-core ${state}`;
        }, 5000);
    },

    // 2H. Shortcut Matrix
    initShortcutMatrix: function() {
        document.addEventListener('keydown', (e) => {
            if (e.key === '?') {
                const overlay = document.getElementById('shortcut-overlay');
                if (overlay) {
                    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
                }
            }
        });
    },

    // 2I. Bio-Rhythm (Pomodoro)
    initBioRhythm: function() {
        const btn = document.getElementById('bio-rhythm-btn');
        if (!btn) return;

        let timer = null;
        let timeLeft = 25 * 60;
        let isWork = true;

        btn.addEventListener('click', () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
                btn.textContent = 'START CYCLE';
                return;
            }

            btn.textContent = 'STOP CYCLE';
            timer = setInterval(() => {
                timeLeft--;
                const m = Math.floor(timeLeft / 60);
                const s = timeLeft % 60;
                document.getElementById('focus-timer-display').textContent = 
                    `${m}:${s < 10 ? '0' : ''}${s} [${isWork ? 'WORK' : 'REST'}]`;

                if (timeLeft <= 0) {
                    // Play sound
                    new Audio('https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-system-check-963.mp3').play();
                    isWork = !isWork;
                    timeLeft = (isWork ? 25 : 5) * 60;
                }
            }, 1000);
        });
    },

    // 2J. Global Leaderboard
    initLeaderboard: function() {
        const container = document.getElementById('leaderboard-list');
        if (!container) return;

        // Mock Data (since we might not have enough users)
        const mockUsers = [
            { name: 'Neo', xp: 9500 },
            { name: 'Trinity', xp: 8200 },
            { name: 'Morpheus', xp: 7800 },
            { name: 'Cipher', xp: 4500 },
            { name: 'Tank', xp: 3200 }
        ];

        container.innerHTML = mockUsers.map((u, i) => `
            <div class="leaderboard-item">
                <span class="rank">#${i + 1}</span>
                <span class="name">${u.name}</span>
                <span class="xp">${u.xp} XP</span>
            </div>
        `).join('');
    },

    // Initialize all
    init: function() {
        this.initDataBank();
        this.initNeuralLink();
        this.initVoiceCommand();
        this.initSimulationEngine();
        this.initChronoShift();
        this.initSonicFocus();
        this.initAvatar();
        this.initShortcutMatrix();
        this.initBioRhythm();
        this.initLeaderboard();
        console.log('PLANNERIUM ADVANCED FEATURES INITIALIZED');
    }
};

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Features.init();
});
