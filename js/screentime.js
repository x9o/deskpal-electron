document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer, remote } = require('electron');
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
        // Send reminder message to the Flask API for chat
        ipcRenderer.send(
            'chat', 
            `Say this line: "Hey! You've been using ${title} for ${timeElapsed} seconds! Take a break if you need to!"`, 
            "YntB_ZeqRq2l_aVf2gWDCZl4oBttQzDvhj9cXafWcF8", 
            "tVwsV_Ih3kZzC9oDGUxm4QXtCG5MvhyG0k1l9ybfPRw"
        );

        // Listen for reply from chat API
        ipcRenderer.removeAllListeners('chat-reply');
        ipcRenderer.on('chat-reply', (event, { replyMessage, audioUrl }) => {
            caption.innerHTML = `Hey! You've been using <span style="color: green;">${title}</span> for <span style="color: blue;">${timeElapsed}</span>!<br>` +
                                `Take a break if you need to!`;
            pet.src = 'assets/dog/anger.gif';
            const currentAudio = new Audio(audioUrl);
            currentAudio.play();

            if (Notification.permission === "granted") {
                new Notification(`Break Reminder`, {
                    body: `You've been using ${title} for ${timeElapsed}. Take a break if you need to!`,
                    icon: 'assets/icon.ico' // Optional: Path to your icon
                });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(`Break Reminder`, {
                            body: `You've been using ${title} for ${timeElapsed}. Take a break if you need to!`,
                            icon: 'assets/icon.ico'
                        });
                    }
                });
            }
        });

        // Trigger a desktop notification
        
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