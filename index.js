const { app, BrowserWindow, Tray, Menu, ipcMain, screen, Notification } = require('electron');
const path = require('path');
const activeWin = require('active-win');
const axios = require('axios');

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainPet();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});