# Demo Scenario: Live Coding Help

## Setup

1. Start the React Frontend and Python Backend locally or on cloud run.
2. The UI will show a clean, modern interface where you can:
   - "Start Screen Sharing"
   - "Start Voice Mentorship"

## Scene

**Pre-condition**: You have VS Code open with a python script (`example.py`) showing an intentional runtime error or a messy piece of logic.

### 1. Activating Mentor

- **User**: Clicks the mic button and screen-share button. Chrome prompts you to share an application window. Pick "VS Code" containing `example.py`.
- **System**: Automatically starts streaming WebRTC media tracks inside React, converts your video frames to JPEG, and sends PCM 16kHz audio buffer out. You will see a glowing animation on your web app indicating the mentor is observing...

### 2. Live Interaction

- **User**: _"Hey Mentor! Could you explain why this loop is causing an error? I thought my range would include the last element."_
- **AI (Voice response via WebAudio)**: _"Ah, I see your code. In Python, the `range` function stops right before the last element! So `range(0, 10)` generates numbers 0 through 9. To include 10, simply change it to `range(0, 11)` or `range(start, end + 1)` depending on your variables!"_
- **User**: _"Got it. What if I use list comprehension instead to build this?"_
- **AI (Voice response)**: _"Perfect idea! That would simplify your code from 4 lines to 1..."_

### 3. Ending Session

- Click "End Session" in the UI.

## Why this is impressive

1. **Context-Aware**: You never pasted the code. Providing no extra text context beyond voice and an app window, the Gemini Live API inferred exactly what piece you were talking about!
2. **Speed & Interruptibility**: The response streams natively the instant it detects a voice pause. You can talk over it to ask immediate clarifying questions and it will pivot naturally.
