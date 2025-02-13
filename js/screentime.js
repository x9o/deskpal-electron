document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    const caption = document.getElementById('caption');
    const pet = document.getElementById('pet');
    const settings = require('./settings.json');

    const windowTimes = {};
    const reminderThreshold = [1800, 3600, 7200]; 

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

    function showReminder(title, timeElapsed) {
        ipcRenderer.send('chat', `You are a reminder for a computer user. Say this to them: "Hey! You've been using ${title} for ${timeElapsed} seconds! Take a break if you need to!"`, "YntB_ZeqRq2l_aVf2gWDCZl4oBttQzDvhj9cXafWcF8", "tVwsV_Ih3kZzC9oDGUxm4QXtCG5MvhyG0k1l9ybfPRw")
        
        ipcRenderer.removeAllListeners('chat-reply');
        
        ipcRenderer.on('chat-reply', (event, { replyMessage, audioUrl }) => {;
            caption.innerHTML = `Hey! You've been using <span style="color: green;">${title}</span> for <span style="color: blue;">${timeElapsed}</span>!<br>` +
                            `Take a break if you need to!`;
            pet.src = 'assets/dog/anger.gif';
            currentAudio = new Audio(audioUrl);
            currentAudio.play();
        });
        
        // const audio = new Audio('assets/alert.mp3');
        // audio.play();

        // caption.style.backgroundColor  = 'rgb(219, 77, 77)';
        setTimeout(() => {
            caption.style.backgroundColor = 'white';
        }, 1000)
        
    }

    function updateCaption(title, memUsage, timeElapsed) {
        if (settings['systeminfo-enabled'] == true) {
            caption.innerHTML = `You're using <span style="color: green;">${title}!</span><br>` +
                                `Memory usage:<span style="color: red;"> ${memUsage}MB</span><br>` +
                                `Time elapsed: <span style="color: blue;">${timeElapsed}</span>`;
        } 
    }

    setInterval(() => {
        Object.keys(windowTimes).forEach(window => {
            if (windowTimes[window].isActive) {
                windowTimes[window].totalSeconds++;

                // Check if the time exceeds the reminder threshold
                if (reminderThreshold.includes(windowTimes[window].totalSeconds)) {
                    const timeElapsed = formatTime(windowTimes[window].totalSeconds);
                    showReminder(window, timeElapsed);
                }
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

            // Update the caption based on the settings
            updateCaption(title, memUsage, timeElapsed);
        }
    });
});