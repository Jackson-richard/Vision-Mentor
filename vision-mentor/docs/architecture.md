# System Architecture

Vision Mentor uses a modern real-time architecture to support audio/video context streamed to a backend, which connects to the **Gemini Live API** for generative tutoring.

## Architecture Diagram

![Architecture](https://github.com/placeholder.png)

### Frontend (React + TypeScript)
- Captures microphone (PCM 16kHz audio data).
- Captures screen share (`getDisplayMedia` API), rendering video to an invisible canvas every 1s, converting to base64 JPEG.
- Establishes a WebSocket connection to the Python backend to continuously stream frames and audio.
- Plays back audio chunks received from the API using an `AudioContext`.

### Backend (Python + FastAPI)
- Handles the WebSocket connections from one or multiple concurrent user clients.
- Establishes a persistent `async` WebSocket integration to Google Cloud / Gemini Live API (using Gemini 3.1 Pro via `google-genai`).
- Relays incoming base64 video/image chunks and PCM audio payload directly into the Live API context window.
- Captures the audio response generation and text annotations and channels those back to the frontend in normalized real-time chunks.

### AI Engine (Gemini)
- Receives multi-modal stream parts continuously.
- Recognizes the voice and correlates it with the latest screenshot context.
- Uses `gemini-3.1-pro` model on Vertex AI / Gemini API to formulate appropriate, low-latency, empathetic responses.

---

## Data Flow Explanation

1. **User shares screen & speaks**: A WebRTC MediaStream hooks the user's screen. At a fast cadence, the Video Track is snapshotted as a JPEG blob. Concurrently, `AudioWorkletNode` processes the microphone input into raw PCM chunks.
2. **Uplink**: WebSockets pass JSON wrappers of `{"type": "realtime_input", "media_chunks": [...]}` containing Voice and Screen to the FastAPI endpoint.
3. **AI Proxy**: FastAPI authenticates and bridges this stream payload straight to Gemini Live API (`wss://generativelanguage.googleapis.com/...`).
4. **Downlink**: Start of utterance (often < 1s latency), Gemini continuously writes PCM audio parts back to the Python backend as raw audio streams. Python echoes them directly over the active client socket.
5. **Playback**: React client enqueues chunks into an audio buffer and a continuous scheduler renders audio output synchronously.

---

## Deployment Instructions (Google Cloud Platform)

### Preparing For Deployment

Dependencies: `gcloud CLI`, Docker, a billing-enabled GCP account.

```bash
# Set your project configuration
gcloud config set project [YOUR_PROJECT_ID]

# Enable Artifact Registry, Run, Vertex AI API
gcloud services enable artifactregistry.googleapis.com run.googleapis.com aiplatform.googleapis.com
```

### Build & Push Container Config

Follow this routine from the `/docker` directory setup:

1. Create a repository for the container in artifact registry:
   ```bash
   gcloud artifacts repositories create vision-mentor-repo \
     --repository-format=docker \
     --location=us-central1
   ```

2. Build and push your image:
   ```bash
   gcloud builds submit --tag us-central1-docker.pkg.dev/[PROJECT_ID]/vision-mentor-repo/vision-mentor-backend:latest ../
   ```

### Deploy to Cloud Run

The backend needs WebSocket support which Cloud Run offers out-of-the-box via HTTP/2 and concurrent requests.

```bash
gcloud run deploy vision-mentor \
  --image us-central1-docker.pkg.dev/[PROJECT_ID]/vision-mentor-repo/vision-mentor-backend:latest \
  --set-env-vars GEMINI_API_KEY="your-gemini-key" \
  --allow-unauthenticated \
  --platform managed \
  --region us-central1 \
  --port 8000
```
This setups your FastAPI layer. Next, just update your React Frontend's socket URL to the returned `wss://<cloud-run-domain>/ws` address!
