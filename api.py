from flask import Flask, jsonify, request
from flask_cors import CORS
from deepface import DeepFace
import cv2
from characterai import aiocai
import json
import asyncio
import threading
import requests
from queue import Queue

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variables for emotion detection

# Global variables for chat functionality
config = json.load(open('settings_python.json'))
client = aiocai.Client(config['cai-token'])
voiceid = config['voice-id']
token = config['cai-token']

chat_connection = None
message_queue = Queue()
response_queue = Queue()
processed_messages = set()  # Track processed messages
processing = threading.Event()

# Emotion Detection Function (Single Analysis)
def analyze_emotion():
    # Capture a single frame from the webcam
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        return None

    # Analyze emotions in the frame
    try:
        result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=True)
        dominant_emotion = result[0]['dominant_emotion']
        return dominant_emotion
    except Exception as e:
        return None

# Emotion Detection API Endpoint
@app.route('/detect_emotion', methods=['GET'])
def detect_emotion_api():
    emotion = analyze_emotion()
    if emotion:
        return jsonify({"emotion": emotion})
    else:
        return jsonify({"emotion": None})

# Chat Functionality
async def maintain_chat_connection():
    global chat_connection
    while True:
        try:
            if chat_connection is None:
                chat_connection = await client.connect()
            
            if not message_queue.empty() and not processing.is_set():
                processing.set()
                # Retrieve message, char_id, and chat_id from the queue
                data = message_queue.get()
                message = data["message"]
                char_id = data["char_id"]
                chat_id = data["chat_id"]

                # Generate a unique key for the message
                message_key = f"{chat_id}:{message}"

                # Skip processing if the message has already been processed
                if message_key in processed_messages:
                    processing.clear()
                    message_queue.task_done()
                    continue
                
                print(message)

                # Use the provided char_id and chat_id in the send_message function
                response = await chat_connection.send_message(
                    char=char_id,
                    chat_id=chat_id,
                    text=message
                )
                
                # Get the audio URL
                datax = response.model_dump()
                audio_response = requests.post(
                    "https://neo.character.ai/multimodal/api/v1/memo/replay",
                    headers={"Authorization": f"Token {token}"},
                    json={
                        "roomId": datax['turn_key']['chat_id'],
                        "turnId": datax['turn_key']['turn_id'],
                        "candidateId": datax['candidates'][0]['candidate_id'],
                        "voiceId": voiceid
                    }
                )
                
                # Add the processed message key to the set
                processed_messages.add(message_key)

                # Put both text and audio URL in the response queue
                response_queue.put({"text": response.text, "audio_url": audio_response.json()["replayUrl"]})
                processing.clear()
                message_queue.task_done()
            
            await asyncio.sleep(0.1)
        except Exception as e:
            print(f"Connection error: {e}")
            if chat_connection:
                await chat_connection.close()
            chat_connection = None
            processing.clear()
            await asyncio.sleep(1)

# Chat API Endpoint
@app.route('/api/data', methods=['POST'])
def getmessage():
    data = request.get_json()
    message = data.get('input_text', 'default message')
    char_id = data.get('char_id', 'default_char_id')  # Get char_id from the request
    chat_id = data.get('chat_id', 'default_chat_id')  # Get chat_id from the request

    # Generate a unique key for the message
    message_key = f"{chat_id}:{message}"

    # Skip adding the message to the queue if it has already been processed
    if message_key in processed_messages:
        return jsonify({"error": "Duplicate message"}), 400

    # Clear any existing messages in the queues
    while not message_queue.empty():
        message_queue.get()
    while not response_queue.empty():
        response_queue.get()
    
    # Add the message, char_id, and chat_id to the message queue
    message_queue.put({"message": message, "char_id": char_id, "chat_id": chat_id})
    
    try:
        # Wait for a response from the response queue
        response = response_queue.get(timeout=30)
        return jsonify(response)  # Return both text and audio URL
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the chat connection loop in a separate thread
def run_async_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(maintain_chat_connection())

chat_thread = threading.Thread(target=run_async_loop, daemon=True)
chat_thread.start()

# Start the Flask app
if __name__ == '__main__':
    app.run(port=5000)