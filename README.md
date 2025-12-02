```text
██████╗ ██╗      █████╗ ███╗   ███╗███╗   ███╗███████╗██████╗ ██╗██╗   ██╗███╗   ███╗
██╔══██╗██║     ██╔══██╗████╗ ████║████╗ ████║██╔════╝██╔══██╗██║██║   ██║████╗ ████║
██████╔╝██║     ███████║██╔████╔██║██╔████╔██║█████╗  ██████╔╝██║██║   ██║██╔████╔██║
██╔═══╝ ██║     ██╔══██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██╔══██╗██║██║   ██║██║╚██╔╝██║
██║     ███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██║  ██║██║╚██████╔╝██║ ╚═╝ ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝     ╚═╝
```

# SYSTEM STATUS: [ONLINE]
### ADVANCED COGNITIVE ARCHITECTURE FOR PROJECT EXECUTION

---

## // MISSION DIRECTIVE
**PLANNERIUM** is a next-generation project orchestration system designed to bridge the gap between abstract intent and concrete execution. Utilizing a multi-agent swarm intelligence, it decomposes high-level objectives into battle-tested strategies, optimizing for velocity, risk mitigation, and resource efficiency.

---

## // SYSTEM CAPABILITIES

### [CORE SYSTEMS: AGENT SWARM]
The neural backbone of Plannerium consists of five specialized autonomous agents:
*   **FRACTAL [Decomposition]**: Deconstructs complex objectives into atomic executable units.
*   **VORTEX [Prioritization]**: Computes impact-to-effort ratios to establish mission hierarchy.
*   **CHRONOS [Scheduling]**: Allocates temporal resources to maximize velocity and minimize friction.
*   **SENTINEL [Risk Analysis]**: Scans for probability variance and critical path dependencies.
*   **CATALYST [Optimization]**: Refines system parameters to reduce waste and accelerate output.

### [INTERFACE: VISUAL CORTEX]
*   **Monochrome Cyberpunk UI**: High-contrast, distraction-free environment designed for deep focus.
*   **Glassmorphism Architecture**: Multi-layered data visualization with real-time blur effects.
*   **Terminal-Grade Feedback**: Typewriter animations and console-style logging for system transparency.
*   **Custom Input Protocols**: Specialized cursor and interaction models for precision control.

### [MODULES: ENHANCEMENT SUITE]
*   **Gamification Engine**: XP tracking, leveling systems, and achievement protocols to incentivize execution.
*   **Sonic Focus**: Binaural beat integration for induced flow states.
*   **Bio-Rhythm Analytics**: Pomodoro-style focus timers synchronized with user energy levels.
*   **Data Bank**: Persistent project storage and retrieval via secure JSON serialization.

---

## // TECH STACK [ARCHITECTURAL LAYERS]

| COMPONENT | TECHNOLOGY | ROLE |
| :--- | :--- | :--- |
| **CORE LOGIC** | **Python (Flask)** | Server-side processing and route handling. |
| **INTELLIGENCE** | **Google Gemini** | LLM backend for agent reasoning and text generation. |
| **PERSISTENCE** | **Firebase** | Real-time database and authentication protocols. |
| **INTERFACE** | **Vanilla JS (ES6+)** | Client-side interactivity and DOM manipulation. |
| **STYLING** | **CSS3 (Variables)** | Responsive design and visual effects. |

---

## // DEPLOYMENT PROTOCOLS

### PRE-REQUISITES
*   Python 3.8+ Environment
*   Google Cloud Project (Gemini API)
*   Firebase Project Credentials

### INITIALIZATION SEQUENCE

1.  **CLONE REPOSITORY**
    ```bash
    git clone https://github.com/your-repo/plannerium.git
    cd plannerium
    ```

2.  **INSTALL DEPENDENCIES**
    ```bash
    pip install -r requirements.txt
    ```

3.  **CONFIGURE ENVIRONMENT VARIABLES**
    Create a `.env` file in the root directory with the following credentials:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    SECRET_KEY=your_flask_secret_key
    ```

4.  **FIREBASE CONFIGURATION**
    Update `static/firebase-init.js` with your project's specific configuration object:
    ```javascript
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    ```

5.  **INITIATE SYSTEM**
    ```bash
    python app.py
    ```
    *Access the interface via `http://localhost:5000`*

---

## // CREDITS

**SYSTEM ARCHITECT**: [ANIRUDDH RATHOD](https://aniruddh-rathod.netlify.app/)

> *“The future is not something we enter. The future is something we create.”*

---

**[END OF TRANSMISSION]**
