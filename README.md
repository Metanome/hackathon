# Esnaf Tezgahı

Esnaf Tezgahı is a multimodal, agentic AI platform engineered for Turkish SMEs, such as local cooperatives, boutique shops, and neighborhood markets. 

Developed for the **YZTA 5.0 Hackathon**, this project modernizes traditional retail operations by eliminating manual data entry. It enables users to seamlessly manage inventory, process customer orders, and handle supplier communications through natural voice commands and image recognition of handwritten order slips or storage shelves.

---

## Key Features

### 1. Multimodal AI Operations
- **Voice Intelligence**: Transcribes Turkish audio notes and extracts structured intents to instantly create orders, update stock levels, or query inventory.
- **Computer Vision**: Performs high-accuracy OCR on handwritten order slips to automatically fulfill orders, and analyzes photos of storage shelves to intelligently estimate remaining stock.
- **Automated Routing**: Inputs are automatically classified and routed to the correct processing agent without manual intervention.

### 2. Autonomous Inventory & Alert Management
- **Real-Time Monitoring**: A dedicated background service continuously monitors inventory levels across all manual, CSV-imported, and AI-driven stock updates.
- **Proactive Alerting**: The system instantly generates dashboard alerts when stock drops below user-defined thresholds (Low or Critical).
- **Automated Supplier Communication**: For critically low items, the platform autonomously drafts professional reorder emails to registered suppliers, ready for review and dispatch.

### 3. Agentic Architecture
Four specialized, interoperable Gemini-powered agents drive the platform's intelligence:
- **Classifier Agent**: Analyzes incoming media and routes it to the appropriate sub-agent based on contextual confidence.
- **Vision Agent**: Extracts structured data from images (receipts, slips, shelf photos).
- **Voice Agent**: Processes raw audio to extract actionable intents and entities.
- **Planner Agent**: Generates transparent, human-readable reasoning logs to explain exactly *why* the AI took specific actions.

---

## Technical Architecture

- **Zero Hardcoding**: All configurations, prompts, and database schemas are dynamically managed and validated using strict Pydantic models.
- **Repository Pattern**: Database interactions are fully decoupled from business logic via specialized repositories (`ProductRepository`, `OrderRepository`, `AlertRepository`), ensuring isolation from raw SQL.
- **Asynchronous Processing**: Non-blocking `FastAPI BackgroundTasks` handle inventory threshold monitoring and email generation without degrading the user experience.
- **Concurrency Protection**: Explicit transaction commit boundaries prevent database deadlocks during multi-threaded background operations.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLite
- **Frontend**: React 18, Vite, Vanilla CSS
- **AI Intelligence**: Google Gemini API (`gemini-2.5-flash`)

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Active Gemini API Key

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory (you can copy `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_MODEL=gemini-2.0-flash
DATABASE_PATH=./esnaf.db
```

Seed the database with sample products and configurations:
```bash
python seed.py
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (you can copy `.env.example`):
```env
VITE_CURRENCY_SYMBOL=₺
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to access the platform.

---

## Hackathon Submission Notes
This repository fulfills the primary criteria of the YZTA 5.0 hackathon: utilizing advanced AI to streamline SME operations using Python, FastAPI, and a robust agent-based architecture powered by Google's Gemini models.
