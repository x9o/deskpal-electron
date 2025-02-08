const { ipcRenderer } = require('electron');
const caption = document.getElementById('caption');


const windowTimes = {};

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        return `${remainingSeconds}s`;
    }
}


setInterval(() => {
    Object.keys(windowTimes).forEach(window => {
        if (windowTimes[window].isActive) {
            windowTimes[window].totalSeconds++;
        }
    });
}, 1000);

ipcRenderer.on('active-window-title', (event, title, memUsage) => {
    if (title !== 'Electron') {
        
        if (!windowTimes[title]) {
            windowTimes[title] = {
                totalSeconds: 0,
                isActive: true
            };
        } else {
            
            Object.keys(windowTimes).forEach(window => {
                windowTimes[window].isActive = (window === title);
            });
        }

        const timeElapsed = formatTime(windowTimes[title].totalSeconds);
        
        caption.innerHTML = `You're using <span style="color: green;">${title}!</span><br>` +
                          `Memory usage:<span style="color: red;"> ${memUsage}MB</span><br>` +
                          `Time elapsed: <span style="color: blue;">${timeElapsed}</span>`;
    }
});