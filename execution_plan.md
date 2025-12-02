# Mission Execution Interface Implementation Plan

## Overview
Build the "Mission Execution Interface" (Tactical Mode) for Plannerium with real-time Firebase synchronization.

## Architecture

### 1. New Route: `/execution/<project_id>`
- Add to `app.py` after `/settings` route
- Render `templates/execution.html`
- Pass `project_id` to template

### 2. Template: `templates/execution.html`
- Extends `base.html`
- Tactical monochrome UI (high contrast black/white)
- Split-screen layout: 60% left panel (task list), 40% right panel (inspector)
- Left Panel: Mission Operations
  - Task list with status indicators (Pending=dimmed, Active=pulsing, Complete=strikethrough)
  - Quick filters: [ALL] / [REMAINING] / [COMPLETED]
  - Dynamic progress bar at top
  - "GENERATE CHECKLIST" button
- Right Panel: Intel Feed
  - Task Inspector (slides in when task clicked)
  - Shows: Title, Vital Stats (Hours, Priority, Risk), Dependencies
  - Action Deck: [START TIMER], [MARK COMPLETE], [FLAG ISSUE]

### 3. JavaScript: `static/execution.js`
- Real-time Firebase sync: `users/{uid}/projects/{activeProjectId}`
- Firebase `.on('value')` listener on mount
- Outbound sync: Task completion and timer updates
- Inbound sync: UI updates on Firebase changes
- Detach listeners on navigation (`.off()`)
- Error handling: Redirect to Data Bank on corruption

### 4. Workflow Integration

#### Path A: New Mission (After Agent Animation)
- In `features.js`, after `finishAgentSequence(true)`, redirect to `/execution/{newProjectId}`
- Project ID from newly created project in Firebase

#### Path B: Resume Mission (From Data Bank)
- In `features.js`, modify `initiateMission()` to redirect to `/execution/{id}` instead of `/app?projectId={id}`

### 5. Active State Indicator
- Add pulsing "LIVE" dot next to [Mission Control] in sidebar
- Show when `currentProjectId` is set (global variable)
- CSS animation: pulse effect
- Update in `base.html` and control via JS

### 6. Real-time Sync Details
- Bind UI directly to Firebase data (no local variables)
- Task completion: Update `projects/{id}/tasks/{index}/completed = true`
- Timer: Update `projects/{id}/tasks/{index}/actual_time = new_value`
- Progress: Auto-calculate and update `projects/{id}/progress`

### 7. Checklist Export
- Filter tasks where `completed === false`
- Generate Markdown: `[ ] Task Name (2h)`
- Use existing export functions or create new
- Download as `.md` file

### 8. Micro-interactions
- Success sound/animation on task complete
- Holographic slide-in for right panel
- Performance: Clean up listeners on unmount

### 9. Error Handling
- Check project data validity on load
- Show "DATA CORRUPTION" alert and redirect if invalid
- Handle Firebase connection issues

## Implementation Order
1. Add route to `app.py`
2. Create `templates/execution.html`
3. Create `static/execution.js`
4. Modify `features.js` for transitions
5. Add LIVE indicator to `base.html`
6. Test integration

## Dependencies
- Existing Firebase setup
- Existing export utilities (`utils.py`)
- Sound files (need to add success sound)
- CSS animations (extend `cyberpunk.css`)