# Vision Mentor

Real-time multimodal AI tutor that can see your screen and hear your voice, providing contextual explanations using Google's Gemini Live API.

## Project Structure

- `frontend/`: React + TypeScript web application for capturing screen and voice input/output.
- `backend/`: FastAPI + Python application serving as a WebSocket bridge between the client and Gemini API.
- `docker/`: Docker configuration for deploying the backend.
- `docs/`: Architecture and demo documentation.

## Setup Instructions

### Backend Setup
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` file and set `GEMINI_API_KEY=your_key_here`
6. Run server: `uvicorn app.main:app --reload --port 8000`

### Frontend Setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Deployment

Refer to [docs/architecture.md](docs/architecture.md) for Google Cloud deployment steps.
