# Vision Mentor

**A Live AI Tutor That Sees What You See**

Vision Mentor is a real-time multimodal AI learning assistant that can **see your screen and hear your voice**, then explain what it observes through natural conversation.

Instead of typing long prompts into a chatbot, users simply **share their screen and ask questions verbally**. Vision Mentor analyzes the visible content—such as code, diagrams, or error messages—and provides **context-aware explanations in real time**.

---

# Problem

Students and developers often struggle to explain their problems clearly to AI tools.

Traditional chatbots require users to manually describe what they are seeing, which creates friction and slows learning.

For example:

* A student viewing a **complex diagram**
* A developer debugging **code errors**
* Someone reading **technical documentation**

In these cases the AI cannot see the user’s context.

This leads to unclear questions and generic answers.

---

# Solution

Vision Mentor solves this by enabling **multimodal interaction**:

* The user shares their **screen**
* The user asks a **question through voice**
* The AI **analyzes what is visible**
* The AI responds with a **spoken explanation**

This creates a natural tutoring experience where the AI understands the user’s environment.

Example interaction:

User:
“Why is this loop causing an error?”

Vision Mentor analyzes the code on the screen and explains the issue in real time.

---

# Key Features

### Screen Awareness

The AI observes the user’s screen and interprets visual context such as:

* source code
* diagrams
* slides
* documentation
* error messages

### Voice Interaction

Users communicate naturally through speech instead of typing prompts.

### Real-Time Responses

The AI generates explanations instantly and delivers them through voice.

### Contextual Tutoring

Instead of generic answers, Vision Mentor explains **exactly what the user is looking at**.

---

# System Architecture

```
User
   ↓
React Frontend
(microphone + screen capture)
   ↓
FastAPI Backend
(WebSocket streaming)
   ↓
Gemini Live API
   ↓
AI reasoning with Gemini models
   ↓
Voice response streamed back to user
```

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Browser Screen Capture API
* Web Audio API

## Backend

* Python
* FastAPI
* WebSockets
* AsyncIO streaming

## AI

* Gemini Live API
* Gemini models for multimodal reasoning

## Cloud

* Google Cloud Run
* Vertex AI
* Firestore
* Cloud Storage

---

# Project Structure

```
vision-mentor/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── hooks/
│   └── App.tsx
│
├── backend/
│   ├── main.py
│   ├── services/
│   └── requirements.txt
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── docs/
│   ├── architecture.md
│   └── demo-scenario.md
│
└── README.md
```

---

# How It Works

1. The user opens the web interface.
2. The user starts **screen sharing**.
3. The user asks a question using their **microphone**.
4. Screen frames and voice data are sent to the backend.
5. The backend forwards the multimodal data to **Gemini Live API**.
6. Gemini analyzes the visual context and generates an explanation.
7. The response is streamed back as **audio output**.

---

# Setup Instructions

## 1. Clone the Repository

```
git clone <repo-url>
cd vision-mentor
```

---

## 2. Backend Setup

```
cd backend
pip install -r requirements.txt
python main.py
```

The backend will start a WebSocket server for streaming communication.

---

## 3. Frontend Setup

```
cd frontend
npm install
npm run dev
```

Open the local development server in your browser.

---

## 4. Environment Configuration

Create an environment file for the backend:

```
GOOGLE_CLOUD_PROJECT=your_project_id
GEMINI_API_KEY=your_api_key
```

---

# Running with Docker

To run the entire system locally:

```
docker-compose up --build
```

This launches the backend service and prepares the system for cloud deployment.

---

# Deployment (Google Cloud)

1. Build the container image
2. Push to **Artifact Registry**
3. Deploy to **Cloud Run**

Example:

```
gcloud builds submit --tag gcr.io/PROJECT_ID/vision-mentor
gcloud run deploy vision-mentor \
  --image gcr.io/PROJECT_ID/vision-mentor \
  --platform managed
```

---

# Demo Scenario

1. Start the Vision Mentor interface
2. Share your screen
3. Display a code snippet or diagram
4. Ask a question such as:

```
Why is this function returning null?
```

5. Vision Mentor analyzes the visible content and explains the issue through voice.

---

# Why Vision Mentor Matters

Vision Mentor transforms how people interact with AI learning tools.

Instead of forcing users to describe their problems manually, the AI can **observe their context directly** and provide immediate guidance.

This enables a new generation of **context-aware AI learning assistants**.

---

# Hackathon Submission

This project was built for the **Gemini Live Agent Challenge**.

The system demonstrates:

* Real-time multimodal AI interaction
* Screen understanding
* Voice-driven tutoring
* Deployment on Google Cloud

---

# Future Improvements

* Visual highlighting of important screen regions
* Multi-language support
* Collaborative tutoring sessions
* Smart code debugging suggestions


