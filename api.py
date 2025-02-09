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
char = config['cai-char-id']
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
                message = message_queue.get()
                response = await chat_connection.send_message(
                    char=char,
                    chat_id="91b31981-860c-48d2-b7fd-6248e61ee4fa",
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
    ms = data.get('input_text', 'default message')
    
    while not message_queue.empty():
        message_queue.get()
    while not response_queue.empty():
        response_queue.get()
    
    message_queue.put(ms)
    
    try:
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