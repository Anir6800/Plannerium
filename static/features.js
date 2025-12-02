
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
        // Create and show Mission Briefing Modal
        this.showMissionBriefing(id, project);
    },

    showMissionBriefing: function(id, project) {
        // Remove existing modal if any
        const existing = document.getElementById('mission-briefing-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'mission-briefing-modal';
        modal.className = 'modal-overlay active';
        modal.style.display = 'flex';
        modal.style.zIndex = '10000';
        
        // Parse lists (handle if they don't exist)
        const risks = project.risks || [];
        const tools = project.tools || [];
        const resources = project.resources || [];
        
        // Find pre-requisites (tasks with no dependencies or first milestone)
        const preTasks = project.tasks ? project.tasks.filter(t => !t.dependencies || t.dependencies.length === 0).slice(0, 3) : [];

        modal.innerHTML = `
            <div class="glass-card mission-briefing-card" style="width: 800px; max-width: 90vw; max-height: 90vh; overflow-y: auto; padding: 0;">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5);">MISSION BRIEFING // ${project.project_name || 'UNTITLED'}</h2>
                        <p style="margin: 5px 0 0; color: #888; font-size: 0.9rem;">ID: ${id}</p>
                    </div>
                    <button class="glass-button secondary small" onclick="document.getElementById('mission-briefing-modal').remove()"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="modal-body" style="padding: 20px;">
                    <div class="briefing-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        
                        <!-- LEFT COLUMN -->
                        <div class="briefing-col">
                            <div class="briefing-section">
                                <h3 class="section-title" style="color: #0ff; border-bottom: 1px solid #0ff; padding-bottom: 5px; margin-bottom: 10px;">> MISSION PARAMETERS</h3>
                                <p><strong>GOAL:</strong> ${project.goal}</p>
                                <p><strong>DEADLINE:</strong> ${project.deadline}</p>
                                <p><strong>STATUS:</strong> <span style="color: ${project.status === 'completed' ? '#0f0' : '#ff0'}">${project.status || 'ACTIVE'}</span></p>
                            </div>

                            <div class="briefing-section" style="margin-top: 20px;">
                                <h3 class="section-title" style="color: #f00; border-bottom: 1px solid #f00; padding-bottom: 5px; margin-bottom: 10px;">> THREAT ASSESSMENT (RISKS)</h3>
                                <ul class="briefing-list" style="list-style: none; padding: 0;">
                                    ${risks.length ? risks.map(r => `<li style="margin-bottom: 5px; color: #faa;"><i class="fas fa-exclamation-triangle"></i> ${r.description || r}</li>`).join('') : '<li style="color: #666;">NO THREATS DETECTED</li>'}
                                </ul>
                            </div>

                            <div class="briefing-section" style="margin-top: 20px;">
                                <h3 class="section-title" style="color: #ff0; border-bottom: 1px solid #ff0; padding-bottom: 5px; margin-bottom: 10px;">> PRE-REQUISITES</h3>
                                <ul class="briefing-list" style="list-style: none; padding: 0;">
                                    ${preTasks.length ? preTasks.map(t => `<li style="margin-bottom: 5px;"><i class="fas fa-check-circle"></i> ${t.title}</li>`).join('') : '<li style="color: #666;">NONE</li>'}
                                </ul>
                            </div>
                        </div>

                        <!-- RIGHT COLUMN -->
                        <div class="briefing-col">
                            <div class="briefing-section">
                                <h3 class="section-title" style="color: #0f0; border-bottom: 1px solid #0f0; padding-bottom: 5px; margin-bottom: 10px;">> LOGISTICS // TOOLS</h3>
                                <div id="tools-list" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;">
                                    ${tools.map(t => `<span class="tag" style="background: rgba(0,255,0,0.1); border: 1px solid #0f0; padding: 2px 8px; font-size: 0.8rem;">${t}</span>`).join('')}
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    <input type="text" id="new-tool-input" placeholder="Add tool..." class="glass-input" style="flex: 1; background: rgba(0,0,0,0.5); border: 1px solid #333; color: #fff; padding: 5px;">
                                    <button class="glass-button small" onclick="Features.addTool('${id}')"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>

                            <div class="briefing-section" style="margin-top: 20px;">
                                <h3 class="section-title" style="color: #00f; border-bottom: 1px solid #00f; padding-bottom: 5px; margin-bottom: 10px;">> INTEL // RESOURCES</h3>
                                <div id="resources-list" style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px;">
                                    ${resources.map(r => `<a href="${r.url || '#'}" target="_blank" class="resource-link" style="color: #aaf; text-decoration: none;"><i class="fas fa-link"></i> ${r.name || r}</a>`).join('')}
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    <input type="text" id="new-resource-name" placeholder="Name" class="glass-input" style="flex: 1; background: rgba(0,0,0,0.5); border: 1px solid #333; color: #fff; padding: 5px;">
                                    <input type="text" id="new-resource-url" placeholder="URL" class="glass-input" style="flex: 1; background: rgba(0,0,0,0.5); border: 1px solid #333; color: #fff; padding: 5px;">
                                    <button class="glass-button small" onclick="Features.addResource('${id}')"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #333; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="glass-button secondary" onclick="document.getElementById('mission-briefing-modal').remove()">ABORT</button>
                    <button class="glass-button primary large" onclick="Features.initiateMission('${id}')">INITIATE MISSION</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },

    addTool: function(projectId) {
        const input = document.getElementById('new-tool-input');
        const value = input.value.trim();
        if (!value) return;

        const user = auth.currentUser;
        if (user) {
            const ref = database.ref(`users/${user.uid}/projects/${projectId}/tools`);
            ref.once('value', snapshot => {
                const tools = snapshot.val() || [];
                tools.push(value);
                ref.set(tools).then(() => {
                    input.value = '';
                    // Refresh modal (hacky but works)
                    database.ref(`users/${user.uid}/projects/${projectId}`).once('value', snap => {
                        this.showMissionBriefing(projectId, snap.val());
                    });
                });
            });
        }
    },

    addResource: function(projectId) {
        const nameInput = document.getElementById('new-resource-name');
        const urlInput = document.getElementById('new-resource-url');
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        
        if (!name) return;

        const user = auth.currentUser;
        if (user) {
            const ref = database.ref(`users/${user.uid}/projects/${projectId}/resources`);
            ref.once('value', snapshot => {
                const resources = snapshot.val() || [];
                resources.push({ name, url });
                ref.set(resources).then(() => {
                    nameInput.value = '';
                    urlInput.value = '';
                    // Refresh modal
                    database.ref(`users/${user.uid}/projects/${projectId}`).once('value', snap => {
                        this.showMissionBriefing(projectId, snap.val());
                    });
                });
            });
        }
    },

    initiateMission: function(id) {
        // Redirect to app with project ID
        window.location.href = `/app?projectId=${id}`;
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

    // 3. Agent Processing Overlay
    showAgentProcessingOverlay: function() {
        // Remove existing
        const existing = document.getElementById('agent-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'agent-overlay';
        overlay.className = 'agent-overlay';
        
        overlay.innerHTML = `
            <div class="agent-header">INITIALIZING MULTI-AGENT SWARM...</div>
            
            <div class="agent-core-container">
                <div class="agent-core"></div>
                <div class="agent-core-inner"></div>
            </div>
            
            <div class="agent-list" id="agent-list">
                <!-- Agents injected here -->
            </div>
            
            <div class="terminal-log-container" id="terminal-log">
                <div class="log-entry">> SYSTEM_INIT... OK</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Render Agents
        const agents = [
            { id: 'decomp', name: 'Decomposition Agent' },
            { id: 'prior', name: 'Prioritization Agent' },
            { id: 'sched', name: 'Scheduling Agent' },
            { id: 'risk', name: 'Risk Analysis Agent' },
            { id: 'opt', name: 'Optimization Agent' }
        ];
        
        const list = document.getElementById('agent-list');
        agents.forEach(agent => {
            const row = document.createElement('div');
            row.className = 'agent-row';
            row.id = `agent-row-${agent.id}`;
            row.innerHTML = `
                <div class="agent-name" data-text="${agent.name}">${agent.name}</div>
                <div class="agent-status">WAITING...</div>
                <div class="agent-progress-bar"></div>
            `;
            list.appendChild(row);
        });
    },

    startAgentSequence: function() {
        return new Promise(async (resolve) => {
            this.showAgentProcessingOverlay();
            
            const agents = ['decomp', 'prior', 'sched', 'risk', 'opt'];
            const logs = [
                ['Parsing goal...', 'Breaking down tasks...', 'Identifying milestones...'],
                ['Calculating impact scores...', 'Sorting by urgency...', 'Assigning weights...'],
                ['Allocating time slots...', 'Checking dependencies...', 'Balancing load...'],
                ['Scanning for bottlenecks...', 'Predicting failure points...', 'Generating mitigation...'],
                ['Refining schedule...', 'Compressing timeline...', 'Finalizing output...']
            ];

            for (let i = 0; i < agents.length; i++) {
                const id = agents[i];
                const row = document.getElementById(`agent-row-${id}`);
                if (!row) continue;
                
                const status = row.querySelector('.agent-status');
                const bar = row.querySelector('.agent-progress-bar');
                const name = row.querySelector('.agent-name');
                
                // Activate
                row.classList.add('active');
                name.classList.add('glitch-text');
                status.textContent = 'PROCESSING...';
                
                // Run Progress Bar & Logs
                const duration = 1500 + Math.random() * 500; // 1.5 - 2.0s
                const startTime = Date.now();
                
                // Log loop
                const logInterval = setInterval(() => {
                    const logMsg = logs[i][Math.floor(Math.random() * logs[i].length)];
                    this.addTerminalLog(`> [${id.toUpperCase()}] ${logMsg}`);
                }, 400);

                await new Promise(r => {
                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min((elapsed / duration) * 100, 100);
                        bar.style.width = `${progress}%`;
                        
                        if (progress < 100) {
                            requestAnimationFrame(animate);
                        } else {
                            r();
                        }
                    };
                    requestAnimationFrame(animate);
                });
                
                clearInterval(logInterval);
                
                // Complete
                row.classList.remove('active');
                name.classList.remove('glitch-text');
                row.classList.add('done');
                status.innerHTML = '<i class="fas fa-check"></i> DONE';
            }
            
            resolve();
        });
    },

    finishAgentSequence: function(success, message) {
        const header = document.querySelector('.agent-header');
        const core = document.querySelector('.agent-core');
        
        if (success) {
            if (header) {
                header.textContent = "SYSTEM READY";
                header.style.color = "#0f0";
                header.style.textShadow = "0 0 20px #0f0";
            }
            this.addTerminalLog("> SEQUENCE COMPLETE. LAUNCHING WORKSPACE...");
        } else {
            if (header) {
                header.textContent = "SYSTEM FAILURE";
                header.style.color = "#f00";
                header.style.textShadow = "0 0 20px #f00";
            }
            if (core) core.style.borderColor = "#f00";
            this.addTerminalLog(`> ERROR: ${message}`);
            this.addTerminalLog("> ABORTING SEQUENCE...");
            
            // Allow manual close on error
            setTimeout(() => {
                const btn = document.createElement('button');
                btn.className = 'glass-button secondary';
                btn.textContent = 'CLOSE OVERLAY';
                btn.style.marginTop = '20px';
                btn.onclick = () => this.closeAgentOverlay();
                const overlay = document.getElementById('agent-overlay');
                if (overlay) overlay.appendChild(btn);
            }, 1000);
        }
    },

    closeAgentOverlay: function() {
        const overlay = document.getElementById('agent-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(() => overlay.remove(), 500);
        }
    },

    addTerminalLog: function(msg) {
        const container = document.getElementById('terminal-log');
        if (!container) return;
        
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.textContent = msg;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
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
