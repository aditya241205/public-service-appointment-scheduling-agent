# CivicEase - Autonomous Agentic AI Appointment Scheduling System

An end-to-end **Agentic AI** appointment scheduling and operations platform powered by **Groq LLM function calling**. Designed for academic demonstrations in Agentic AI courses.

---

## Architecture Overview

The system features two dedicated portals backed by a secure Node.js + Express backend with autonomous tool calling:

```
.
├── .env                             # Environment variables & Groq credentials
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies & run scripts
├── server.js                        # Application entry point
├── public/                          # Frontend client assets
│   ├── index.html                   # Citizen / Customer Portal UI
│   ├── retailer.html                # Retailer / Operations Dashboard UI
│   ├── css/
│   │   └── styles.css               # Unified responsive design system
│   └── js/
│       ├── customer.js              # Citizen portal client script & AI drawer
│       └── retailer.js              # Retailer operations script & AI co-pilot
└── src/                             # Backend architecture & Agentic AI
    ├── config/
    │   └── config.js                # Environment config & IPv4 DNS enforcement
    ├── models/
    │   └── dataStore.js             # Data persistence (services, slots, bookings)
    ├── data/
    │   └── store.json               # JSON database file
    ├── controllers/
    │   ├── serviceController.js     # Service catalogue & slots endpoints
    │   ├── bookingController.js     # Appointment bookings, reschedule & cancel
    │   ├── slotController.js        # Slot blocking & center analytics
    │   └── agentController.js       # Agentic AI chat routing
    ├── routes/
    │   └── api.js                   # REST API router
    └── agents/
        ├── agentEngine.js           # Groq LLM tool calling & multi-hop loop
        ├── prompts.js               # Customer & Retailer system personas
        └── tools/
            ├── customerTools.js     # Citizen tools (book, reschedule, checklist)
            └── retailerTools.js     # Retailer tools (schedule, block, analytics)
```

---

## The Two Portals

### 1. Citizen / Customer Portal (index.html)
- **Interactive Catalogue**: Explore 6 civic departments with document checklists and estimated consultation durations.
- **Dynamic Slot Availability**: Real-time slot checking reflecting booked slots and officer administrative blocks.
- **Appointment Management**: Book, reschedule, and cancel bookings with unique reference codes (CE-XXXXXX).
- **Autonomous Citizen AI Agent**:
  - Powered by Groq LLM with function calling.
  - Can answer questions about documents and policies.
  - **Takes autonomous actions**:
    - check_slot_availability
    - book_appointment
    - lookup_booking
    - reschedule_appointment
    - cancel_appointment
  - Renders execution badges (e.g. `[Action] Autonomous Tool: book_appointment`) showing real agentic actions.

### 2. Retailer / Officer Operations Portal (retailer.html)
- **Operations Dashboard**: Real-time KPI summary (Total Bookings, Active Visits, Cancelled Slots, Blocked Slots).
- **Live Citizen Schedule**: Searchable, filterable appointments table with administrative cancel & reschedule controls.
- **Slot Capacity & Blocking Matrix**: Interactive matrix allowing the officer to block or unblock slots for staff training, lunch, or maintenance with a single click.
- **Operations Co-Pilot AI Agent**:
  - Officer-specific assistant with administrative tool execution:
    - get_daily_schedule
    - get_all_appointments
    - block_or_unblock_slot
    - reschedule_citizen_booking
    - cancel_citizen_booking
    - get_center_analytics
  - Automatically updates the live UI whenever the officer agent executes state-altering commands!

---

## How to Run Locally

### 1. Requirements
- Node.js (v18+)

### 2. Configure Environment (.env)
Create or edit `.env` in the root directory:
```env
PORT=3000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

### 3. Start the Server
```bash
npm start
```
Then open:
- **Customer Portal**: `http://localhost:3000/index.html`
- **Retailer / Operations Portal**: `http://localhost:3000/retailer.html`

---

## Agentic AI Course Demonstration Guide

1. **Citizen Autonomous Booking**:
   - Open the Citizen AI assistant and type:
     > *"Book an appointment for Document Services tomorrow at 10:00 AM for Rahul, rahul@gmail.com"*
   - Watch the agent execute `book_appointment`, record the slot in `store.json`, and return reference details and checklists.
2. **Operations Dashboard & Schedule Inspection**:
   - Navigate to the **Officer / Retailer Portal** (`retailer.html`).
   - Notice Rahul's booking automatically appear in the schedule table.
3. **Autonomous Slot Blocking**:
   - Open the Operations AI Co-Pilot in the Retailer view and command:
     > *"Block the 1:30 PM slot for Document Services tomorrow for staff training"*
   - The agent calls `block_or_unblock_slot`, blocking the slot in real time.
4. **Operations Analytics Briefing**:
   - Ask the Operations Agent:
     > *"Give me an operational summary of our appointments and center analytics"*
   - The agent executes `get_center_analytics` and `get_daily_schedule` and generates an executive report with recommendations.
