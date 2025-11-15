// Homepage Interactive Features

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Demo functionality
    window.scrollToDemo = function() {
        const demoSection = document.getElementById('demo');
        demoSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    window.runDemo = async function() {
        const demoButton = document.querySelector('#demo button[onclick="runDemo()"]');
        const demoOutput = document.getElementById('demo-output');
        
        // Disable button and show loading
        demoButton.disabled = true;
        demoButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Demo...';
        
        // Show loading animation
        demoOutput.innerHTML = `
            <div class="demo-loading">
                <div class="spinner"></div>
                <p>AI agents are analyzing your project...</p>
                <div class="demo-progress">
                    <div class="progress-bar">
                        <div class="progress-fill demo-progress-fill"></div>
                    </div>
                    <span class="demo-progress-text">0%</span>
                </div>
            </div>
        `;
        
        // Simulate progress
        let progress = 0;
        const progressFill = demoOutput.querySelector('.demo-progress-fill');
        const progressText = demoOutput.querySelector('.demo-progress-text');
        
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 300);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Clear progress interval
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
            
            // Show results
            setTimeout(() => {
                demoOutput.innerHTML = `
                    <div class="demo-results">
                        <div class="result-card glass-card">
                            <div class="result-header">
                                <i class="fas fa-tasks"></i>
                                <h4>Task Breakdown</h4>
                            </div>
                            <div class="result-content">
                                <div class="task-item">
                                    <span class="task-name">UI/UX Design</span>
                                    <span class="task-duration">2 weeks</span>
                                </div>
                                <div class="task-item">
                                    <span class="task-name">Frontend Development</span>
                                    <span class="task-duration">4 weeks</span>
                                </div>
                                <div class="task-item">
                                    <span class="task-name">Backend API</span>
                                    <span class="task-duration">3 weeks</span>
                                </div>
                                <div class="task-item">
                                    <span class="task-name">Testing & QA</span>
                                    <span class="task-duration">2 weeks</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="result-card glass-card">
                            <div class="result-header">
                                <i class="fas fa-chart-pie"></i>
                                <h4>Schedule Overview</h4>
                            </div>
                            <div class="result-content">
                                <div class="schedule-item">
                                    <span class="schedule-phase">Phase 1</span>
                                    <span class="schedule-weeks">Weeks 1-3</span>
                                </div>
                                <div class="schedule-item">
                                    <span class="schedule-phase">Phase 2</span>
                                    <span class="schedule-weeks">Weeks 4-7</span>
                                </div>
                                <div class="schedule-item">
                                    <span class="schedule-phase">Phase 3</span>
                                    <span class="schedule-weeks">Weeks 8-11</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="result-card glass-card">
                            <div class="result-header">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h4>Risk Analysis</h4>
                            </div>
                            <div class="result-content">
                                <div class="risk-item low">
                                    <span class="risk-level">Low</span>
                                    <span class="risk-desc">Technical complexity</span>
                                </div>
                                <div class="risk-item medium">
                                    <span class="risk-level">Medium</span>
                                    <span class="risk-desc">Third-party integrations</span>
                                </div>
                                <div class="risk-item high">
                                    <span class="risk-level">High</span>
                                    <span class="risk-desc">User adoption rate</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="demo-actions">
                            <a href="/app" class="glass-button primary">
                                <i class="fas fa-rocket"></i>
                                Try Full Version
                            </a>
                            <button class="glass-button secondary" onclick="resetDemo()">
                                <i class="fas fa-redo"></i>
                                Run Again
                            </button>
                        </div>
                    </div>
                `;
            }, 500);
            
        } catch (error) {
            demoOutput.innerHTML = `
                <div class="demo-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Something went wrong. Please try again.</p>
                </div>
            `;
        } finally {
            // Re-enable button
            demoButton.disabled = false;
            demoButton.innerHTML = '<i class="fas fa-magic"></i> Generate Demo Plan';
        }
    };
    
    window.resetDemo = function() {
        const demoOutput = document.getElementById('demo-output');
        demoOutput.innerHTML = `
            <div class="demo-placeholder">
                <i class="fas fa-robot"></i>
                <p>Click "Generate Demo Plan" to see the AI in action</p>
            </div>
        `;
    };

    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .timeline-item, .demo-container');
    animateElements.forEach(el => observer.observe(el));

    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'var(--glass-bg)';
            navbar.style.backdropFilter = 'var(--glass-blur)';
        }
    });

    // Add loading animation to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-actions .glass-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.href.includes('/app')) {
                // Add loading state
                const originalContent = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                this.style.pointerEvents = 'none';
                
                // Reset after navigation
                setTimeout(() => {
                    this.innerHTML = originalContent;
                    this.style.pointerEvents = 'auto';
                }, 2000);
            }
        });
    });

    console.log('🚀 Plannerium homepage loaded with interactive features!');
});

// Add CSS for demo-specific styles
const demoStyles = `
<style>
.demo-loading {
    text-align: center;
    padding: 2rem;
}

.demo-progress {
    margin: 1rem 0;
}

.demo-progress-fill {
    transition: width 0.3s ease;
    background: var(--gradient-primary) !important;
}

.demo-progress-text {
    display: block;
    margin-top: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
}

.demo-results {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.result-card {
    padding: 1.5rem;
    border-radius: 12px;
    transition: transform 0.3s ease;
}

.result-card:hover {
    transform: translateY(-2px);
}

.result-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.result-header i {
    color: var(--primary);
    font-size: 1.2rem;
}

.result-header h4 {
    margin: 0;
    color: var(--text-primary);
    font-weight: 600;
}

.result-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.task-item,
.schedule-item,
.risk-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--glass-border);
}

.task-item:last-child,
.schedule-item:last-child,
.risk-item:last-child {
    border-bottom: none;
}

.task-duration,
.schedule-weeks,
.risk-level {
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

.task-duration,
.schedule-weeks {
    background: var(--glass-bg);
    color: var(--text-secondary);
}

.risk-level.low {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.risk-level.medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

.risk-level.high {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.demo-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}

.demo-error {
    text-align: center;
    color: var(--error);
    padding: 2rem;
}

.demo-error i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in-up {
    animation: fadeInUp 0.6s ease-out;
}
</style>
`;

// Inject demo styles
document.head.insertAdjacentHTML('beforeend', demoStyles);