from flask import Flask, jsonify, request
from flask_cors import CORS
from characterai import aiocai
import json, asyncio, threading, requests
from queue import Queue
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)
CORS(app)

config = json.load(open('settings_python.json'))
client = aiocai.Client(config['cai-token'])
voiceid = config['voice-id']
token = config['cai-token']

chat_connection = None
message_queue = Queue()
response_queue = Queue()
processing = threading.Event()

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

@app.route('/api/data', methods=['POST'])
def getmessage():
    data = request.get_json()
    message = data.get('input_text', 'default message')
    char_id = data.get('char_id', 'default_char_id')  # Get char_id from the request
    chat_id = data.get('chat_id', 'default_chat_id')  # Get chat_id from the request

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

def run_async_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(maintain_chat_connection())

chat_thread = threading.Thread(target=run_async_loop, daemon=True)
chat_thread.start()

if __name__ == '__main__':
    app.run(port=5000)