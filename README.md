<p align="center">
  <img src="frontend/src/assets/logo-icon.svg" width="72" height="72" alt="Esnaf Tezgahı" />
</p>
<h1 align="center">Esnaf Tezgahı</h1>
<p align="center"><em>Smart Merchant Assistant</em></p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3" /></a>
</p>

**Esnaf Tezgahı** is a multimodal, agentic AI platform engineered for Turkish SMEs — local cooperatives, boutique shops, and neighborhood markets.

Developed for the **YZTA 5.0 Hackathon**, it modernizes traditional retail by eliminating manual data entry. Merchants manage inventory, process customer orders, and handle supplier communications through natural voice commands and image recognition of handwritten order slips or storage shelves — all in Turkish or English.

## The Problem

Turkey's small merchants — corner grocery stores, local cooperatives, market stalls — run their businesses on paper. Orders are written by hand, inventory is tracked in notebooks, and supplier communication happens over the phone. This creates a cycle of errors, stockouts, and lost revenue that enterprise software doesn't solve, because it's too expensive, too complex, and built for a different user.

The barrier isn't willingness. It's the interface. Typing product names and quantities into a computer is slower than writing them on a slip of paper. Merchants don't adopt digital tools because digital tools don't adapt to how they already work.

## The Solution

Esnaf Tezgahı meets merchants where they are. Instead of forcing a new workflow, it accepts the inputs they already use — a photo of a handwritten order slip, a voice note in Turkish, a quick scan of a storage shelf — and handles everything else automatically.

- A merchant photographs a handwritten order slip → the platform reads it, creates the order, and deducts stock.
- A merchant records a voice note saying stock arrived → inventory is updated instantly.
- A merchant photographs a shelf → stock levels are estimated and synced.
- When stock runs low, automated reorder emails are sent directly to suppliers.

No forms. No typing. No training required. Just the tools they already have — a phone and their own language.

## A Day in the Life

**Mehmet** runs a small grocery cooperative in Ankara. His Tuesday morning looks like this:

1. A delivery arrives. Mehmet takes a photo of the storage shelf with his phone and uploads it. Esnaf Tezgahı scans the image, identifies each product, estimates quantities, and updates his inventory — in seconds.

2. A regular customer calls in an order. Mehmet records a quick voice note in Turkish: *"Ahmet Bey'e 3 kilo domates, 2 kilo soğan."* The platform transcribes it, matches the items to his product catalog, creates the order, and deducts the stock automatically.

3. At the end of the day, Mehmet's dashboard shows a low-stock alert on olive oil. Esnaf Tezgahı has already drafted and sent a reorder email to his supplier.

Mehmet never opened a spreadsheet. He never typed a product name. He just ran his store.

## Key Features

### 1. Multimodal AI Input
- **Voice Intelligence** — Record or upload a Turkish/English audio note. The platform transcribes it, extracts structured intent (create order, update stock, query inventory), and acts immediately.
- **Order Slip OCR** — Photograph a handwritten order slip. The Vision Agent reads it, matches products, creates the order, and updates inventory.
- **Shelf Scan** — Photograph a storage shelf. The Vision Agent estimates stock levels for each visible product and updates inventory accordingly.
- **Automated Routing** — A dedicated Classifier Agent inspects each media file and routes it to the correct sub-agent with no manual selection required.

### 2. Inventory Management
- Full **CRUD** for products with name, SKU (auto-generated if blank), category, unit price, stock quantity, reorder threshold, supplier name, and supplier email.
- **11 canonical units** (`pcs`, `kg`, `g`, `L`, `ml`, `pkg`, `box`, `btl`, `carton`, `sack`, `bunch`) stored as language-neutral keys and displayed in the active UI language.
- **Inline quick-edit** directly in the inventory table row.
- **Modal full-edit** with all fields including supplier details.
- **Search & filter** by product name / SKU and by stock status (Normal / Low / Critical).
- **Paginated table** (20 rows per page) with mobile-responsive column hiding.
- **CSV import** — bulk-upload products via a structured CSV file.
- **Pydantic validation** — `stock_quantity`, `reorder_threshold`, and `unit_price` all enforce `≥ 0` at the API layer.

### 3. Order Management
- Orders are created automatically by AI agents or manually.
- Each order carries a **status workflow**: `Pending → Fulfilled / Cancelled`.
- **Stock deduction on fulfilment** — when an order is marked fulfilled, the system validates that every line item has sufficient stock before deducting. If any product is short, the fulfilment is rejected with a detailed per-item error.
- Order items display product name, quantity, unit, and unit price.

### 4. Alerts & Supplier Automation
- Background task runs after every stock change (manual edit, CSV import, AI update) and checks each product against its reorder threshold.
- Alerts classified as **Low** (stock < threshold) or **Critical** (stock ≤ 20% of threshold).
- For **Critical** items with a registered supplier email, the platform autonomously drafts a professional reorder email ready for dispatch.
- Alerts are dismissible from the Alerts page; unread count is shown on the header bell icon in real time.

### 5. Agentic Architecture & Transparency
Four specialized Gemini-powered agents:

| Agent | Responsibility |
|---|---|
| **Classifier** | Inspects incoming media, determines type (order slip / shelf scan / unknown), routes accordingly |
| **Vision** | Extracts structured order or stock data from images using OCR and contextual reasoning |
| **Voice** | Transcribes audio, identifies intent and entities (product, quantity, unit, customer) |
| **Planner** | Synthesizes a human-readable reasoning log explaining every action taken |

Every upload produces a **Reasoning Panel** in the UI showing the full chain of thought and a timestamped action log. All agent runs are persisted in the **Activity** log for audit.

### 6. Real-Time Updates
- A **Server-Sent Events (SSE)** channel pushes `"update"` events from the backend to all connected clients instantly after any data change — no polling required.
- Dashboard metrics, inventory counts, alerts, and order lists all refresh live.

### 7. Bilingual UI (Turkish / English)
- Full translation coverage for every label, placeholder, error message, and AI action string.
- Language auto-detected from browser locale on first launch; persisted to the user profile in the database.
- Toggle in the header (desktop) or user menu (mobile) switches language instantly.
- AI prompts instruct Gemini to respond in the active language; backend action strings are also translated via `i18n.py`.

### 8. Theming & Accessibility
- **Dark / Light themes** — Midnight Indigo dark mode and a clean light mode, both driven by CSS custom properties.
- **Animated theme transition** — uses the View Transitions API (Chrome/Edge) for a smooth full-page crossfade; falls back to CSS transitions on other browsers.
- **3 font size levels** — Medium / Large / Extra-large, cycled from the user menu.
- **Reduced-motion support** — all transitions collapse to near-instant when `prefers-reduced-motion` is set.

### 9. Settings & Profile
- **First-launch setup wizard** — prompts for display name and store name before first use.
- **Profile editor** — accessible via the user menu; updates display name, store name, and language preference.
- **User menu controls** — theme toggle, language toggle, and font size cycle are available from the avatar menu on all pages (also exposed as quick-access buttons in the desktop header).
- **Model selector** — choose from available Gemini models dynamically fetched from the API.
- **API key update** — change the active Gemini API key at runtime without restarting.
- **Database reset** — wipes and re-seeds the database from the Settings page Danger Zone.

## Application Pages

| Page | Description |
|---|---|
| **Dashboard** | KPI cards (orders today, total revenue, active alerts, total products), inventory health bar (Normal / Low / Critical breakdown), active alerts list (up to 5, dismissible inline) |
| **Upload** | Drag-and-drop or click zone for order slip image, shelf scan image, and a browser microphone voice recorder |
| **Inventory** | Paginated product table with search, filter, inline edit, CSV import, and Add Product modal |
| **Orders** | Full order list with status badges, expandable item details, and fulfil/cancel actions |
| **Alerts** | Active stock alerts with severity badges and dismiss controls |
| **Activity** | Chronological agent action log with input type, reasoning, actions taken, and model used |
| **Settings** | Gemini model selection, Gemini API key update, current model/key status, and database reset (Danger Zone) |

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.11, FastAPI 0.115, SQLite, Pydantic v2, `google-genai` 1.14, `uvicorn` |
| **Frontend** | React 18, Vite, TailwindCSS v4, CSS Custom Properties |
| **AI** | Google Gemini (`gemini-2.0-flash` default; model is configurable) |
| **Realtime** | Server-Sent Events (SSE) |
| **Testing** | Manual |

## Project Structure

```
hackathon/
├── backend/
│   ├── agents/              # classifier, vision, voice, planner agents
│   ├── repositories/        # ProductRepository, OrderRepository, AlertRepository, AgentLogRepository
│   ├── routers/             # FastAPI route handlers (inventory, orders, alerts, upload, settings, events)
│   ├── schemas/             # Pydantic models for products, orders, alerts, agents, settings
│   ├── services/            # alert_service, event_service, gemini_service
│   ├── config.py            # Pydantic Settings from .env
│   ├── database.py          # SQLite init & table creation
│   ├── i18n.py              # Backend string translations (TR/EN)
│   ├── prompts.py           # Gemini prompt templates
│   ├── seed.py              # Sample data seeder
│   └── main.py              # FastAPI app entry point
└── frontend/
    ├── src/
    │   ├── api/             # Axios client + per-resource API modules
    │   ├── components/      # Header, Navbar, UserMenu, Icons, StockBadge, etc.
    │   ├── hooks/           # useInventory, useOrders, useAlerts, useToast
    │   ├── pages/           # Dashboard, Upload, Inventory, Orders, Alerts, Activity, Settings
    │   ├── providers/       # ThemeProvider, ProfileProvider
    │   ├── constants.js     # All TR/EN translations, unit labels, route constants
    │   └── index.css        # CSS variables, theme definitions, global component styles
    └── public/
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

Copy the example env file and add your API key:
```bash
cp .env.example .env
```
```env
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_MODEL=gemini-2.0-flash
DATABASE_PATH=./esnaf.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Seed the database with sample products:
```bash
python seed.py
```

Start the API server:
```bash
python main.py
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Copy the example env file:
```bash
cp .env.example .env
```
```env
VITE_CURRENCY_SYMBOL=₺
```

Start the dev server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The frontend dev server proxies `/api` requests to `http://localhost:8000` automatically via Vite config.

## CSV Import Format

To bulk-import products via the Inventory page, prepare a UTF-8 CSV with these columns:

| Column | Required | Default | Notes |
|---|---|---|---|
| `name` | ✓ | — | Product display name |
| `sku` | — | auto-generated | Unique identifier; auto-generated as `PRD-XXXXXXXX` if blank |
| `category` | — | `General` | |
| `stock_quantity` | — | `0` | Must be ≥ 0 |
| `reorder_threshold` | — | `10` | Must be ≥ 0 |
| `unit_price` | — | `0.00` | Must be ≥ 0 |
| `unit` | — | `pcs` | Canonical key: `pcs`, `kg`, `g`, `L`, `ml`, `pkg`, `box`, `btl`, `carton`, `sack`, `bunch` |
| `supplier_name` | — | `""` | |
| `supplier_email` | — | `""` | Used for automated reorder emails |

## Hackathon Submission Notes

This project fulfills the primary criteria of the **YZTA 5.0 Hackathon**: utilizing advanced AI to streamline SME operations with Python, FastAPI, and a robust multi-agent architecture powered by Google Gemini. It goes beyond basic integration by implementing autonomous reasoning, real-time event streaming, bilingual localization, and a production-quality frontend.
