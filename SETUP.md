# Plannerium - Setup & Enhancement Guide

## 🎨 UI Enhancements Made

### Visual Improvements
✅ **Enhanced Glass Design System** - Improved glassmorphism effects with better blur, shadows, and gradient overlays
✅ **Better Animations** - Added smooth slide-in animations for cards, toasts, and sections
✅ **Improved Progress Bars** - Gradient progress bars with glow effects and shimmer animation
✅ **Enhanced Tables** - Better styling with gradient headers, hover effects, and improved spacing
✅ **Optimization Cards** - New beautiful card design for optimization suggestions
✅ **Toast Notifications** - Slide-in toast notifications with color-coded messages
✅ **Better Input Focus States** - Enhanced focus indicators with scaling and glow effects
✅ **Responsive Grid** - Auto-responsive charts grid that adapts to screen size
✅ **Tab Styling** - Modern tab design with underline indicators and smooth transitions

### Backend Improvements  
✅ **Graceful Fallback Mode** - App runs in demo mode without `GEMINI_API_KEY`
✅ **Error Handling** - Robust null-checking in JavaScript to prevent runtime errors
✅ **DOM Safety** - All event listeners check for element existence before attaching

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
# Navigate to project directory
cd c:\Users\ANIRUDDH\Documents\trae_projects\Plannerium

# Create virtual environment (optional but recommended)
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Set API Key (Optional)
```powershell
# If you have a Google GenAI API key, set it:
$env:GEMINI_API_KEY='your-api-key-here'

# Otherwise, leave it empty for demo mode:
$env:GEMINI_API_KEY=''
```

### 3. Run the App
```powershell
python app.py
```

### 4. Access the App
- Open your browser and go to: **http://localhost:5000**
- Homepage: Shows features and process
- App: Click "Launch App" or go to **http://localhost:5000/app**

## 🎯 Feature Testing Checklist

### Homepage (http://localhost:5000/)
- [ ] Navigation menu is responsive
- [ ] Hero section displays properly with floating animations
- [ ] Features grid is responsive
- [ ] Process section shows 4 steps
- [ ] Footer is visible and styled

### App Page (http://localhost:5000/app)
- [ ] Input section shows all fields (Goal, Dates, Hours)
- [ ] Generate Plan button works
- [ ] Loading overlay shows agent progress
- [ ] Results display with 5 tabs: Tasks, Schedule, Risks, Optimizer, Visuals
- [ ] Charts render in the Visuals tab
- [ ] Export CSV/PDF buttons work
- [ ] Save/Load projects work
- [ ] Chat panel can be opened/closed
- [ ] Dark/Light theme toggle works

### Responsive Design
- [ ] Layout works on desktop (1920px+)
- [ ] Layout works on tablet (768px)
- [ ] Layout works on mobile (375px)
- [ ] Mobile menu toggle appears on small screens
- [ ] Tables are readable on mobile

## 📊 Demo Mode

If you don't have a `GEMINI_API_KEY`:
- ✅ App will generate a mock project plan
- ✅ Chat will return a friendly demo message
- ✅ All UI features work normally
- ✅ Perfect for testing the interface

## 🔧 Key CSS Variables

The app uses a comprehensive design system with these key variables:
```css
--primary-500: #0ea5e9      /* Main blue */
--accent: #0284c7           /* Button color */
--success: #22c55e          /* Green */
--warning: #f59e0b          /* Orange */
--danger: #ef4444           /* Red */
--glass-blur: blur(20px)    /* Glass effect */
```

## 📁 Project Structure

```
├── app.py                  # Flask main app
├── agents.py              # AI agent pipeline
├── utils.py               # Utility functions
├── requirements.txt       # Python dependencies
├── static/
│   ├── style.css         # Main app styles (ENHANCED)
│   ├── homepage.css      # Homepage styles
│   ├── script.js         # App logic (ENHANCED)
│   └── homepage.js       # Homepage scripts
├── templates/
│   ├── index.html        # App interface (ENHANCED)
│   └── homepage.html     # Landing page
└── storage/              # Saved projects directory
```

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Use a different port
python app.py  # Default is 5000
# Or modify app.py: app.run(port=5001)
```

### CSS/JS Not Loading
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check console for errors (F12)

### Charts Not Rendering
- Make sure Chart.js CDN is accessible
- Check browser console for errors
- Verify data is populated in Results tab

### API Key Issues
- Leave `GEMINI_API_KEY` empty to use demo mode
- If you have a key, ensure it's valid
- Check Python logs for detailed errors

## 💡 Next Steps

1. **Connect Real AI** - Set up valid `GEMINI_API_KEY`
2. **Deploy** - Use Gunicorn/Heroku for production
3. **Add Features** - Extend with more export formats, real-time collab
4. **Database** - Replace JSON storage with proper database
5. **Auth** - Add user authentication and project ownership

## 📝 Notes

- All changes are backward compatible
- Demo mode works without any API setup
- UI is fully responsive (mobile-first design)
- Dark mode fully supported
- Accessibility focused (WCAG compliant styling)

---

**Happy Planning! 🚀**
