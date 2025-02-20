const { app, BrowserWindow, Tray, Menu, ipcMain, screen, Notification } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const axios = require('axios');
const { spawn } = require('child_process');

let tray = null;
let controlPanelWindow = null;
let mainWindow = null;


function mainPet() {
  let { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'assets/icon.ico'),
    movable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('pet.html');

  

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  ipcMain.on('mouse-over-pet', () => {
    mainWindow.setIgnoreMouseEvents(false);
  });

  ipcMain.on('mouse-leave-pet', () => {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  });

  ipcMain.on('mouse-over-input', () => {
    mainWindow.setIgnoreMouseEvents(false);
  });

  ipcMain.on('mouse-leave-input', () => {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  });

  ipcMain.on('console-log', (event, message) => {
    console.log(message);
  });
  

  ipcMain.on('get-time-and-reason-for-reminder', (event, inputValue) => {
    // const url = 'https://magicloops.dev/api/loop/3c18e07e-01f5-424b-ac36-b5cfb091b647/run';
    // { isReminder, time, reason }
    const url = 'https://magicloops.dev/api/loop/282b664e-931c-4019-bdf8-0120ee87b615/run'
    

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: inputValue }), // Pass inputValue as the command
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then((responseJson) => {
        const { isReminder, isSleepy, reminderReason, timeSpecification } = responseJson; // Destructure response
        console.log(responseJson);
        event.reply('time-and-reason-for-reminder', { isReminder, isSleepy, reminderReason, timeSpecification });
    })
    .catch((error) => {
        console.error('Error fetching the reminder:', error);
        event.reply('time-and-reason-for-reminder', { error: error.message });
    });
  });



  ipcMain.on('set-time-and-reason', (event, { isReminder, isSleepy, reminderReason, timeSpecification }) => {
    event.reply('set-time-and-reason', { isReminder, isSleepy, reminderReason, timeSpecification });
  });



  ipcMain.on('stop-cycling-interval', (event) => {
    event.reply('stop-cycling-interval');
  })




  ipcMain.on('chat', async (event, message, char, chat) => {
    try {
        const response = await axios.post('http://localhost:5000/api/data', {
            input_text: message,
            char_id: char,
            chat_id: chat
        });

          
        const replyMessage = response.data.text;
        const audioUrl = response.data.audio_url;

        // Send the reply message to the renderer process
        mainWindow.webContents.send('chat-reply', { replyMessage, audioUrl });

        
        
    } catch (error) {
        console.error('Error communicating with Flask API:', error);
    }
  });


  ipcMain.on('run-nightlight', (event) => {
    const exePath = path.join(__dirname, 'nightlight.exe'); // Path to the .exe file
    const child = spawn(exePath, [], { detached: true, stdio: 'ignore' }); // Run the .exe file

    child.on('error', (error) => {
      console.error('Error running nightlight.exe:', error);
      event.reply('run-nightlight-error', error.message);
    });

    child.on('close', (code) => {
      console.log(`nightlight.exe exited with code ${code}`);
      event.reply('run-nightlight-success', `nightlight.exe ran successfully with exit code ${code}`);
    });
  });


  setInterval(async () => {
      const activeWindow = await activeWin();
      if (activeWindow) {                                                                                           // bytes to mb
          mainWindow.webContents.send('active-window-title', activeWindow.owner.name, (activeWindow.memoryUsage / 1048576).toPrecision(5));
      }
  }, 1000);
  
  
}

function ControlPanel() {
  controlPanelWindow = new BrowserWindow({
    width: 800,
    height: 600 ,
    frame: false,
    movable: true,  
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  controlPanelWindow.loadFile('menus/ctrlpanel.html');
}


let emotionHistory = []; // Stores the last 4 detected emotions

async function checkUserEmotion() {
    try {
        const response = await axios.get('http://127.0.0.1:5000/detect_emotion');
        const emotion = response.data.emotion;

        if (emotion) {
            console.log(`Detected Emotion: ${emotion}`);

            // Map "fear", "sad", and "angry" to a single category ("negative")
            const mappedEmotion = (emotion === 'fear' || emotion === 'sad' || emotion === 'angry') ? 'negative' : emotion;

            // Add the mapped emotion to the history
            emotionHistory.push(mappedEmotion);

            // Keep only the last 4 emotions
            if (emotionHistory.length > 6) {
                emotionHistory.shift(); // Remove the oldest emotion
            }

            // Check for consistency in the last 4 emotions
            if (emotionHistory.length === 6 && emotionHistory.every(e => e === emotionHistory[0])) {
                console.log(`Consistent Emotion Detected: ${emotionHistory[0]}`);
                // Trigger pet's behavior based on the consistent emotion
                encourageUser(emotionHistory[0]);

                // Reset the emotion history after triggering the event
                emotionHistory = [];
            }
        }
    } catch (error) {
        console.error('Error detecting emotion:', error);
    }
}

// Function to encourage the user based on detected emotion
function encourageUser(emotion) {
    // Add logic to make the pet encourage the user based on the emotion
    console.log(`Pet is responding to emotion: ${emotion}`);
    // Example: Display a message, play a sound, or animate the pet
    if (mainWindow) {
        mainWindow.webContents.send('emotion-detected', emotion);
    }
}

// Start checking for emotions periodically
function startEmotionDetection() {
    setInterval(checkUserEmotion, 3000); // Check every 3 seconds
}



app.whenReady().then(() => {


  app.setAppUserModelId('DeskPal');


  mainPet();


  tray = new Tray(path.join(__dirname, 'assets/icon.ico')); 
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Control Panel', click: ControlPanel },
    { label: 'Hide Pet', click: () => mainWindow.hide() },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Deskpal');
  tray.setContextMenu(contextMenu);
  startEmotionDetection();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainPet();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});