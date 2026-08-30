# Agentflow_AI — Agentic AI Operations Automation Platform

**Agentflow_AI** is a full-stack, enterprise-ready AI Operations Automation Platform that lets operators describe complex business automations in natural language and instantly turn them into executable visual workflow graphs. 

The platform generates workflow graphs from AI prompts, renders them on an interactive visual canvas (@xyflow/react), executes them through a 5-agent orchestration engine (Planner, Execution, Validation, Recovery, Monitoring), integrates with real third-party tools (Gmail, Slack, Discord, Google Sheets) over OAuth, queues background jobs with Redis/BullMQ, and streams live real-time execution events over Socket.IO.

---

## Key Features

- **Natural-Language Prompt-to-Workflow Builder**: Converts plain English instructions into connected DAG workflow graphs with named nodes, positions, and per-node configurations. Includes OpenRouter, Google Gemini, and a deterministic rule-engine fallback.
- **Interactive Visual Canvas**: Drag-and-drop workflow editor built with `@xyflow/react`, customizable node palette, and dynamic node configuration side-panel.
- **5-Agent Orchestration Engine**:
  1. **Planner Agent**: Analyzes DAG structures, orders execution steps, and emits confidence scores.
  2. **Execution Agent**: Dispatches actions to third-party integration drivers and AI models.
  3. **Validation Agent**: Verifies required output schemas and payload fields.
  4. **Recovery Agent**: Classifies failures (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and decides between exponential backoff retries and escalation.
  5. **Monitoring Agent**: Emits real-time Socket.IO audit events and persists logs into MongoDB.
- **OAuth & Encrypted Credentials**: Supports Gmail, Slack, Discord, and Google Sheets integrations with AES-256 credential encryption at rest (`CREDENTIAL_ENCRYPTION_KEY`).
- **Real-Time Audit Timeline**: Live Socket.IO event streaming renderable directly on operator dashboards and single execution views.
- **Zero-Setup Local Dev Fallbacks**: Automatically falls back to MongoDB Memory Server and an In-Memory async queue processor when Mongo or Redis services are not running locally.

---

## Tech Stack

### Frontend (`/client`)
- **Framework**: Next.js 14 (Pages Router), React 18
- **Styling**: Tailwind CSS, Vanilla CSS design tokens (`globals.css`), Lucide React icons
- **State Management**: Zustand (`authStore.js`, `workflowStore.js`)
- **Canvas Engine**: React Flow (`@xyflow/react`)
- **Real-Time Client**: Socket.IO Client singleton (`socket.js`)
- **HTTP Client**: Axios with automatic JWT interceptors (`api.js`)

### Backend (`/server`)
- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB & Mongoose (with `mongodb-memory-server` fallback)
- **Authentication**: JWT & Bcrypt password hashing (Cost factor 12)
- **Background Queue**: BullMQ on ioredis (with in-memory fallback queue)
- **Real-Time Server**: Socket.IO
- **Security & Utilities**: Helmet, CORS, Morgan, Compression, Express Validator, Express Rate Limit

---

## Architecture & Project Structure

```
c:\Users\Lenovo\Desktop\New folder\
├── client/                     # Next.js (Pages Router) Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppShell/       # Top Header, Sidebar Navigation, Notifications Drawer
│   │   │   ├── MetricGrid/     # Dashboard KPI Stats Cards
│   │   │   ├── NodePalette/    # Visual node library (Gmail, Slack, AI, Sheets, etc.)
│   │   │   ├── NodeConfigPanel/# Side panel for editing node properties
│   │   │   ├── WorkflowCanvas/ # React Flow visual canvas integration
│   │   │   ├── Timeline/       # Live 5-agent execution event stream
│   │   │   ├── Notifications/  # Operator alerts drawer
│   │   │   └── ProtectedRoute/ # JWT auth route guard
│   │   ├── pages/
│   │   │   ├── _app.js         # Global styles & Zustand auth hydration
│   │   │   ├── index.js        # Modern Landing Page
│   │   │   ├── login.js        # Operator Sign In
│   │   │   ├── register.js     # Operator Account Registration
│   │   │   ├── dashboard.js    # Operator Console & Metrics
│   │   │   ├── integrations.js # Third-party OAuth connection panel
│   │   │   ├── settings.js     # Platform health diagnostics & security settings
│   │   │   ├── executions/
│   │   │   │   ├── index.js    # Executions audit log list
│   │   │   │   └── [id].js     # Single execution details & live timeline
│   │   │   └── workflows/
│   │   │       ├── index.js    # Workflows list & management
│   │   │       ├── builder.js  # AI Prompt-to-Workflow Builder
│   │   │       └── [id].js     # Interactive visual graph editor
│   │   ├── store/
│   │   │   ├── authStore.js    # Persistent authentication state
│   │   │   └── workflowStore.js# Visual canvas & node selection state
│   │   └── services/
│   │       ├── api.js          # Axios client
│   │       └── socket.js       # Socket.IO client singleton
│   ├── package.json
│   └── tailwind.config.js
│
└── server/                     # Express.js Backend Server
    ├── src/
    │   ├── config/
    │   │   ├── env.js          # Environment configuration
    │   │   ├── db.js           # Mongoose setup + Memory Server fallback
    │   │   └── socket.js       # Socket.IO server & event emitter utilities
    │   ├── models/             # Mongoose Models (User, Workflow, Execution, ExecutionLog, Integration, Notification, AgentMemory)
    │   ├── services/           # Business Logic Layer (authService, workflowService, executionService, aiService, integrationService)
    │   ├── agents/             # 5-Agent Engine (plannerAgent, executionAgent, validationAgent, recoveryAgent, monitoringAgent, orchestrator)
    │   ├── integrations/       # BaseIntegration class & provider drivers (Gmail, Slack, Discord, Google Sheets)
    │   ├── controllers/        # Express HTTP controllers
    │   ├── routes/             # Express API routes
    │   ├── middleware/         # Auth verification & global error handlers
    │   └── queues/             # BullMQ Redis queue + in-memory fallback
    └── package.json
```

---

## Quick Start Guide

### 1. Environment Setup

Copy or configure environment variables in `server/.env` (optional defaults are already configured in `server/src/config/env.js`):

```env
PORT=5000
NODE_ENV=development
# MongoDB Atlas Cloud Connection String
MONGO_URI=mongodb+srv://<db_username>:<db_password>@agenticai.rp4t0qn.mongodb.net/agentflow_ai?retryWrites=true&w=majority&appName=agenticai
JWT_SECRET=agentflow_secret_jwt_key_2026_super_secure
REDIS_URL=redis://localhost:6379
CREDENTIAL_ENCRYPTION_KEY=12345678901234567890123456789012
CLIENT_URL=http://localhost:3000
OPENROUTER_API_KEY=
GEMINI_API_KEY=
```

### 2. Run Both Backend & Frontend Simultaneously

Run the unified development command from the root directory:

```bash
npm run dev
```

* This automatically starts both:
  * **Backend Express Server**: `http://localhost:5000`
  * **Frontend Next.js Application**: `http://localhost:3000`

---

## API Reference

### Health & Authentication
- `GET /api/health` — System heartbeat, database status, and LangGraph substrate check.
- `POST /api/auth/register` — Register a new operator user account.
- `POST /api/auth/login` — Authenticate and issue JWT.
- `GET /api/auth/me` — Fetch current user profile.

### Workflows
- `GET /api/workflows/dashboard` — Aggregated metrics & dashboard stats.
- `GET /api/workflows` — List user workflows with pagination & search filtering.
- `POST /api/workflows` — Create a new custom workflow.
- `POST /api/workflows/generate` — Generate workflow graph from prompt via AI.
- `GET /api/workflows/:id` — Fetch single workflow graph.
- `PUT /api/workflows/:id` — Update workflow nodes and edges.
- `POST /api/workflows/:id/duplicate` — Clone existing workflow.
- `POST /api/workflows/:id/execute` — Trigger workflow execution run.
- `DELETE /api/workflows/:id` — Delete workflow.

### Executions
- `GET /api/executions` — List execution audit history.
- `GET /api/executions/:id` — Get execution run details & immutable graph snapshot.
- `GET /api/executions/:id/timeline` — Fetch 5-agent step logs.
- `POST /api/executions/:id/pause` — Pause running execution.
- `POST /api/executions/:id/resume` — Resume paused execution.
- `POST /api/executions/:id/cancel` — Cancel running execution.

### Integrations & Notifications
- `GET /api/integrations` — List connected OAuth service integrations.
- `GET /api/integrations/oauth/:provider/start` — Initiate OAuth connection.
- `GET /api/integrations/oauth/:provider/callback` — OAuth callback handler.
- `POST /api/integrations` — Manual bot token/API key setup.
- `DELETE /api/integrations/:provider` — Disconnect provider integration.
- `GET /api/notifications` — Fetch user alerts.
- `PUT /api/notifications/read-all` — Mark alerts as read.

---

## Verification & Auditing

You can verify the full end-to-end functionality by:
1. Navigating to `http://localhost:3000/register` and creating an account.
2. Visiting `http://localhost:3000/workflows/builder` and generating a workflow graph from a prompt.
3. Clicking **Open & Edit on Visual Canvas** to view the graph in `@xyflow/react`.
4. Clicking **Run Workflow** to trigger execution and watching the live 5-agent events stream in real-time.
