import asyncio
import websockets
import json

async def test_connection():
    uri = "ws://127.0.0.1:8000/ws"
    
    print(f"Connecting to {uri} ...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected to the backend!")
            
            # Send an arbitrary payload simulating a React chunk
            test_payload = {
                "test": "hello from python client"
            }
            await websocket.send(json.dumps(test_payload))
            print("Message sent")
            
            # Since the backend simply passes through clientContent/unknown payloads 
            # or proxies correctly to Gemini, we just verify the handshake here
            print("Frontend Handshake verification complete. Disconnecting.")
            
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
