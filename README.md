# Faraway HTM - Salary Negotiator Poker Game

A full-stack web application that teaches salary negotiation through an interactive poker-style game. Built with AI agents that simulate real HR behavior and provide coaching feedback.

## 📋 Project Overview

**What is it?**
An innovative learning platform where players negotiate salaries with AI-powered HR agents in a poker-style game format. Players learn negotiation strategies while receiving real-time coaching from AI advisors.

**Tech Stack:**
- **Backend:** Flask (Python) + MongoDB (with JSON fallback)
- **Frontend:** Next.js + React + TypeScript
- **AI:** Google Generative AI (with compatibility wrapper for legacy API)
- **Database:** MongoDB or local JSON fallback
- **Scraping:** BeautifulSoup4 + Requests

---

## 🏗️ Architecture

### Backend Components

#### Four AI Agents (`backend/app/agents/`)

| Agent | Purpose | Key Functions |
|-------|---------|---------------|
| **Researcher** | Ingests salary data from CSV and web scraping | `run_once()`, `run_with_seeds()`, `fetch_from_url()` |
| **Calculator** | Computes fair salary ranges | `calculate_salary(company, role, city, current_offer)` |
| **Actor** | Simulates HR responses | `respond()`, `respond_with_genai()` |
| **Coach** | Analyzes negotiations, provides feedback | `analyze_session()`, `log_player_action()` |

**Researcher Agent Details:**
- Reads `india_salary_data.csv` (294 rows of salary data)
- Scrapes Levels.fyi and Glassdoor for live market data
- Stores data in MongoDB or JSON fallback files
- Optional: Background scheduler runs daily at 06:00 to refresh data

**Calculator Agent Details:**
- Queries salary research collection
- Returns: `{"low", "ask", "high", "best_case", "lowest_acceptable"}`
- Uses market data to compute fair negotiation ranges

**Actor Agent Details:**
- Simulates company HR behavior during negotiation
- Two modes:
  - Heuristic: Rule-based responses (always works)
  - GenAI: Uses Google Generative AI for realistic dialogue
- Fallback support if GenAI API key not provided

**Coach Agent Details:**
- Analyzes completed negotiation sessions
- Provides heuristic feedback or GenAI-powered advice
- Tracks player actions and game outcomes
- Returns: `{"advice", "session_id", "actions_count"}`

#### GenAI Integration (`genai_wrapper.py`)
- Unified interface supporting both:
  - **New SDK:** `google-genai` (0.4.0)
  - **Legacy SDK:** `google.generativeai`
- Auto-detection: tries new SDK first, falls back gracefully
- Used by Actor for HR dialogue and Coach for feedback
- Gracefully degrades if no API key provided

#### Data Scrapers (`scrapers.py`)
**Levels.fyi Scraper:**
- URL pattern: `levels.fyi/company/{company}/salaries/`
- Extracts salary ranges using regex
- Returns: min, max, average salary ranges

**Glassdoor India Scraper:**
- URL pattern: `glassdoor.co.in/Reviews/{company}-reviews`
- Parses compensation information
- Fallback parsing: works with or without beautifulsoup4

#### Game Services (`backend/app/services/game2_service.py`)
- Core negotiation game logic
- Initializes negotiation sessions with salary recommendations
- Processes player moves:
  - **Counter**: Make counter-offer
  - **Justify**: Provide reasoning
  - **Trade**: Offer alternative compensation
  - **Walk**: Walk away from negotiation
- Returns HR response, verdict, feedback, and salary delta

#### API Routes

```
POST /api/game2/init              → Start new session + salary recommendation
POST /api/game2/move              → Process player move
POST /api/coach/report            → Get coaching analysis
GET  /api/health                  → Health check
```

### Frontend Components

#### Pages & Routes
- **`/dashboard/game2`**: Main salary negotiation game interface
- Flow: Setup → Gameplay (4 rounds) → Post-Session Analysis

#### New UI Features

**1. Market Recommendation Panel** (During Gameplay)
- Location: Left sidebar
- Displays:
  - **Ask**: Recommended salary to negotiate for
  - **High/Low Ranges**: Market data bounds
  - **"Ask Coach" Button**: Real-time coaching during game
- Data source: `POST /api/game2/init` → `salary_recommendation`

**2. Coach Report** (Post-Session)
- Button: **"Get Coach Report"**
- Displays:
  - Total negotiation actions taken
  - Heuristic advice OR GenAI-powered feedback
  - Specific recommendations for improvement
- Data source: `POST /api/coach/report`

**3. Components Used**
- `ChipStack`: Visual salary delta display
- `PokerCard`: HR and player card displays
- `Button`: Action buttons
- Custom hooks: `useTypewriter` for text effects

---

## 📊 Data Flow

```
User fills setup form
    ↓
Frontend: POST /api/game2/init (company, role, offer, resume, etc.)
    ↓
Backend: Calculator agent computes market data
    ↓
Returns: { sessionId, salary_recommendation, baseSalary, companyRange }
    ↓
Frontend: Displays recommendation panel in sidebar during gameplay
    ↓
User plays 4 rounds of negotiation
    ↓
During any round: Click "Ask Coach" button
    ↓
Frontend: POST /api/coach/report with sessionId
    ↓
Backend: Coach analyzes all player actions in session
    ↓
Returns: { advice, actions_count, session_id }
    ↓
Frontend: Display feedback in modal
    ↓
Game ends after round 4
    ↓
Post-session: Click "Get Coach Report" for final analysis
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+ (with npm or pnpm)
- MongoDB (optional; uses JSON fallback if unavailable)

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   bash scripts/install_agent_deps.sh
   ```
   This installs:
   - apscheduler (background scheduling)
   - requests + beautifulsoup4 (web scraping)
   - google-genai (GenAI SDK)

2. **Set environment variables:**
   ```bash
   export SECRET_KEY=dev
   export JWT_SECRET_KEY=dev
   export CORS_ORIGINS=http://localhost:3000
   export GOOGLE_API_KEY=your_genai_key_here  # Optional (for GenAI features)
   export MONGO_URI=mongodb://...              # Optional (uses JSON fallback if not set)
   ```

3. **Run the server:**
   ```bash
   python3 run.py
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   # or
   pnpm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
   Server runs on `http://localhost:3000`

3. **Open in browser:**
   ```
   http://localhost:3000/dashboard/game2
   ```

---

## 🎮 How to Use

### Playing the Game

**Step 1: Setup Phase**
1. Navigate to `http://localhost:3000/dashboard/game2`
2. Fill in the form:
   - **Target Company**: Any company (e.g., "Flipkart", "Google", "Microsoft")
   - **Target Role**: Job position (e.g., "Senior Software Engineer")
   - **Initial Salary Offer**: Current offer in Lakh (e.g., "12")
   - **Resume Text**: Upload or paste your resume

3. Click **"Start Salary Negotiation ->"**

**Step 2: Gameplay Phase** (4 Rounds)
1. Left sidebar shows:
   - **Market Recommendation**: Your recommended ask price
   - **HR Proposal**: What the company is offering
   - **Your Cards**: Negotiation moves available

2. Choose your move each round:
   - **Counter**: Make a counter-offer
   - **Justify**: Provide reasoning for your position
   - **Trade**: Offer alternative compensation
   - **Walk**: Walk away from negotiation

3. **Optional: Get Real-Time Coaching**
   - Click **"Ask Coach"** button anytime
   - Receive advice on your negotiation strategy

4. After each move, see:
   - HR's response and counter-offer
   - Salary delta (gain/loss)
   - Round verdict

**Step 3: Post-Session Phase**
1. After 4 rounds, game ends
2. See total salary negotiated
3. Click **"Get Coach Report"** button
4. Receive personalized feedback:
   - Total actions taken
   - What you did well
   - Areas for improvement
   - Tips for next negotiation

---

## 📁 Project Structure

```
Faraway-HTM/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── researcher.py          # CSV + web scraping
│   │   │   ├── calculator.py          # Salary computation
│   │   │   ├── actor.py               # HR simulation
│   │   │   ├── coach.py               # Session analysis
│   │   │   ├── genai_wrapper.py       # GenAI compatibility
│   │   │   ├── scrapers.py            # Levels.fyi + Glassdoor
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── game2_service.py       # Game logic
│   │   │   ├── db_service.py          # Database utilities
│   │   │   └── __init__.py
│   │   ├── controllers/
│   │   │   ├── game2_controller.py    # Game endpoints
│   │   │   ├── coach_controller.py    # Coach endpoint
│   │   │   └── __init__.py
│   │   ├── routes/
│   │   │   ├── game2_routes.py        # Game routes
│   │   │   ├── coach_routes.py        # Coach routes
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── extensions.py
│   │   └── __init__.py
│   ├── data/                          # Fallback JSON storage
│   ├── scripts/
│   │   ├── install_agent_deps.sh
│   │   └── run_researcher.py
│   ├── run.py
│   ├── requirements.txt
│   └── requirements-agents.txt
│
├── frontend/
│   ├── app/
│   │   ├── api/                       # API routes
│   │   ├── dashboard/
│   │   │   └── game2/
│   │   │       └── page.tsx           # Main game UI
│   │   ├── game3/
│   │   ├── game4/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── game3/
│   │   ├── game4/
│   │   ├── onboarding/
│   │   ├── ui/
│   │   └── ...
│   ├── lib/
│   │   ├── game3.types.ts
│   │   ├── game4.types.ts
│   │   ├── utils.ts
│   │   └── auth.ts
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.mjs
│
├── india_salary_data.csv              # Seed salary data
├── package.json
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the `backend/` directory:

```env
# Flask Configuration
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here
DEBUG=True

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Database Configuration (Optional)
MONGO_URI=mongodb://username:password@localhost:27017/
MONGODB_URI=mongodb://username:password@localhost:27017/
MONGO_DB_NAME=faraway_htm

# AI Configuration (Optional)
GOOGLE_API_KEY=your_google_genai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Research Configuration
RESEARCH_SEEDS=Google|Senior Engineer,Flipkart|SDE,https://www.levels.fyi/company/Amazon
```

### Default Values

| Variable | Default | Required? |
|----------|---------|-----------|
| `SECRET_KEY` | None | ✅ Yes |
| `JWT_SECRET_KEY` | None | ✅ Yes |
| `CORS_ORIGINS` | `*` | ❌ Optional |
| `MONGO_URI` | None | ❌ Optional (uses JSON fallback) |
| `GOOGLE_API_KEY` | None | ❌ Optional (uses heuristic fallback) |

---

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:5000/api/health
# Expected: {"status": "ok"}
```

### Game Initialization
```bash
curl -X POST http://localhost:5000/api/game2/init \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Flipkart",
    "role": "SDE",
    "currentOffer": 2000000,
    "resumeText": "experienced engineer",
    "predictedSalary": 3000000,
    "salaryUnit": "lakh"
  }'
```

### Coach Report
```bash
curl -X POST http://localhost:5000/api/coach/report \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "poker_xyz123"}'
```

---

## 📦 Dependencies

### Backend
- Flask (web framework)
- pymongo (database)
- apscheduler (job scheduling)
- requests (HTTP client)
- beautifulsoup4 (HTML parsing)
- google-genai (Google Generative AI SDK)
- python-dotenv (environment variables)

### Frontend
- Next.js (React framework)
- React (UI library)
- TypeScript (type safety)
- TailwindCSS (styling)

---

## 🔐 Database

### MongoDB Connection
If `MONGO_URI` is set, the app connects to MongoDB and stores:
- `salary_research`: Scraped salary data
- `coach_actions`: Player actions during sessions
- `company_behaviors`: HR profile data

### JSON Fallback
If MongoDB is unavailable, data is stored in:
- `backend/data/salary_research_fallback_*.json`
- `backend/data/coach_actions_*.json`

---

## 🤖 AI Features

### GenAI Integration
- **Primary SDK**: google-genai (new, faster, recommended)
- **Fallback SDK**: google.generativeai (legacy, deprecated)
- **No API Key**: Heuristic responses (always works)

To enable GenAI features, set `GOOGLE_API_KEY`:
```bash
export GOOGLE_API_KEY=sk-...
```

### Actor Agent (HR Simulation)
With GenAI enabled, HR responses are generated using:
```python
genai_client.generate_text(
  prompt="You are an HR negotiator. Respond to this offer: ..."
)
```

### Coach Agent (Feedback)
With GenAI enabled, coaching advice is:
```python
genai_client.generate_text(
  prompt="Analyze this negotiation session and provide advice..."
)
```

---

## 🚨 Troubleshooting

### Backend Won't Start
**Problem**: `Address already in use` on port 5000
```bash
# Kill existing process
lsof -i :5000
kill -9 <PID>
```

**Problem**: `ModuleNotFoundError: No module named 'google.genai'`
```bash
# Install dependencies
cd backend
bash scripts/install_agent_deps.sh
```

### Frontend Won't Load
**Problem**: `CORS error` when calling backend
- Ensure `CORS_ORIGINS=http://localhost:3000` in backend `.env`
- Restart backend server

**Problem**: `API endpoint not found`
- Check backend is running on `http://localhost:5000`
- Verify all routes are registered in `backend/app/__init__.py`

### Coach Report Returns Generic Advice
**Problem**: Coach not using GenAI
- Set `GOOGLE_API_KEY` environment variable
- Restart backend server
- Coach will now generate personalized feedback

### Salary Recommendation Not Showing
**Problem**: Frontend shows no market data
- Check `salary_recommendation` field in game2/init response
- Verify `india_salary_data.csv` exists in project root
- Check backend logs for errors

---

## 📈 Performance Tips

1. **Enable MongoDB** for better performance with large datasets
2. **Cache salary data** by running researcher periodically
3. **Use GenAI** for more realistic HR behavior
4. **Enable APScheduler** for automatic daily data refresh

---

## 🔄 API Documentation

### POST /api/game2/init
**Initialize a new salary negotiation session**

**Request:**
```json
{
  "companyName": "string",
  "role": "string",
  "currentOffer": number,
  "resumeText": "string",
  "predictedSalary": number,
  "salaryUnit": "lakh" | "crore"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "baseSalary": number,
  "marketAverage": number,
  "companyRange": {
    "min": number,
    "max": number
  },
  "salary_recommendation": {
    "ask": number,
    "high": number,
    "low": number,
    "best_case": number,
    "lowest_acceptable": number
  }
}
```

### POST /api/game2/move
**Process a player move in the negotiation**

**Request:**
```json
{
  "sessionId": "string",
  "moveType": "Counter" | "Justify" | "Trade" | "Walk",
  "moveData": "object"
}
```

**Response:**
```json
{
  "hrResponse": "string",
  "salaryDelta": number,
  "verdict": "string",
  "feedback": "string"
}
```

### POST /api/coach/report
**Get coaching analysis for a session**

**Request:**
```json
{
  "sessionId": "string"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "session_id": "string",
    "actions_count": number,
    "advice": "string"
  }
}
```

---

## 📝 Notes

- All salary amounts are in **Indian Rupees (₹)**
- Default salary unit is **Lakh** (₹100,000)
- Negotiation consists of **4 rounds** (fixed)
- Background scheduler requires **APScheduler** installation
- Web scraping works with or without **BeautifulSoup4**

---

## 🎯 Future Enhancements

- [ ] Multi-language support
- [ ] Real-time multiplayer negotiations
- [ ] Advanced analytics dashboard
- [ ] Integration with real job boards
- [ ] Mobile app version
- [ ] Voice-based negotiations
- [ ] Video interview simulations

---

## 📄 License

MIT License - Feel free to use and modify for your needs.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review backend logs: `backend/app/__init__.py`
3. Check frontend console for errors (F12 in browser)
4. Verify all environment variables are set correctly

---

**Last Updated**: June 14, 2026
**Version**: 1.0.0
