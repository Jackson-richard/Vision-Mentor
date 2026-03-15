import os
import json
import base64
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import websockets

load_dotenv(override=True)

app = FastAPI(title="Vision Mentor Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# By default, we use gemini-2.5-flash-native-audio-latest as it supports the realtime bidi API
# (gemini-2.0-flash-exp was deprecated and removed from this endpoint)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash-native-audio-latest")
HOST = "generativelanguage.googleapis.com"
WS_URL = f"wss://{HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={GEMINI_API_KEY}"

@app.get("/")
def health_check():
    return {"status": "ok", "service": "vision-mentor"}

@app.websocket("/ws")
async def websocket_endpoint(client_ws: WebSocket):
    await client_ws.accept()
    print("Client connected")
    
    # Read API key dynamically
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("Error: GEMINI_API_KEY is not set correctly or is missing.")
        await client_ws.send_text(json.dumps({"error": "GEMINI_API_KEY is not set correctly"}))
        await client_ws.close()
        return

    # Use the specific Live API model as requested
    gemini_model = "models/gemini-2.5-flash"
    ws_url = f"wss://{HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={api_key}"

    try:
        async with websockets.connect(ws_url, open_timeout=None) as gemini_ws:
            print("Gemini connection established")
            
            # Initial Setup - send system instructions
            setup_msg = {
                "setup": {
                    "model": gemini_model,
                    "systemInstruction": {
                        "parts": [{
                            "text": "You are Vision Mentor, an expert AI coding tutor. You can see the user's screen and hear their voice context simultaneously. Respond verbally in a concicse, helpful, and natural conversational manner. Do not use markdown if the response defaults to audio."
                        }]
                    }
                }
            }
            await gemini_ws.send(json.dumps(setup_msg))

            # Wait for setup completion
            setup_response = await gemini_ws.recv()
            print("Gemini Setup Response Received:", setup_response[:100], "...")

            async def receive_from_client():
                """Receive audio/video data from the frontend and forward to Gemini."""
                try:
                    while True:
                        data = await client_ws.receive_text()
                        print("Receiving message")
                        
                        # Ignore empty frames
                        if not data or data.strip() == "":
                            continue
                            
                        try:
                            payload = json.loads(data)
                        except json.JSONDecodeError:
                            print("Received malformed JSON payload. Ignoring.")
                            continue
                        
                        # Validate and forward the input chunk correctly
                        if "realtime_input" in payload:
                            media_chunks = payload["realtime_input"].get("media_chunks", [])
                            if not media_chunks:
                                continue
                                
                            formatted_chunks = []
                            for chunk in media_chunks:
                                mime_type = chunk.get("mime_type", "")
                                if "audio" in mime_type:
                                    print("Receiving audio chunk and sending to Gemini")
                                    # Fallback mapping if frontend defaults to generic audio/pcm strings
                                    mime_type = "audio/pcm;rate=16000"
                                elif "image" in mime_type:
                                    print("Receiving frame chunk and sending to Gemini")
                                
                                formatted_chunks.append({
                                    "mimeType": mime_type,
                                    "data": chunk.get("data", "")
                                })
                            
                            # Send real-time input to Gemini using the exact expected structure
                            try:
                                await gemini_ws.send(json.dumps({
                                    "realtimeInput": {
                                        "mediaChunks": formatted_chunks
                                    }
                                }))
                            except websockets.exceptions.ConnectionClosed as e:
                                print(f"Gemini WS closed while sending data: {e}")
                                break
                                
                        elif "clientContent" in payload:
                            # Pass-through fallback
                            await gemini_ws.send(json.dumps(payload))
                            
                except WebSocketDisconnect:
                    print("Client disconnected")
                except Exception as e:
                    print(f"Error reading client: {e}")

            async def receive_from_gemini():
                """Receive responses from Gemini and send them to the frontend."""
                try:
                    async for message in gemini_ws:
                        try:
                            msg_data = json.loads(message)
                        except json.JSONDecodeError:
                            continue
                            
                        # Look for Audio Parts to return
                        if "serverContent" in msg_data:
                            model_turn = msg_data["serverContent"].get("modelTurn")
                            if model_turn:
                                parts = model_turn.get("parts", [])
                                for part in parts:
                                    if "inlineData" in part:
                                        mime_type = part["inlineData"].get("mimeType", "")
                                        # Forward Audio specifically
                                        if mime_type.startswith("audio/pcm"):
                                            print("Gemini response received (audio chunk)")
                                            await client_ws.send_text(json.dumps({
                                                "type": "audio",
                                                "data": part["inlineData"]["data"]
                                            }))
                except websockets.exceptions.ConnectionClosed as e:
                    print(f"Gemini WS disconnected externally: {e}")
                except Exception as e:
                    print(f"Error reading gemini ws: {e}")

            task1 = asyncio.create_task(receive_from_client())
            task2 = asyncio.create_task(receive_from_gemini())
            
            done, pending = await asyncio.wait([task1, task2], return_when=asyncio.FIRST_COMPLETED)
            
            for task in pending:
                task.cancel()
                
    except Exception as e:
        print(f"Connection failed to Gemini: {e}")
        try:
            await client_ws.close()
        except Exception:
            pass
