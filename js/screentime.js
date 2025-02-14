document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer, remote } = require('electron');
    const caption = document.getElementById('caption');
    const pet = document.getElementById('pet');
    const settings = require('./settings.json');

    const windowTimes = {};
    const reminderThreshold = [1800, 3600, 7200]; 

    function formatTime(seconds) {
        if (seconds === 0) {
            return 'now';
        }
    
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`; // Skip seconds for hours
        } else if (minutes > 0) {
            return `${minutes}m`; // Skip seconds for minutes
        } else {
            return `${remainingSeconds}s`;
        }
    }

    function parseTime(timeString) {
        const timeParts = timeString.trim().split(' ');
    
        // Validate input
        if (timeParts.length !== 2 || isNaN(timeParts[0])) {
            console.error('Invalid time format:', timeString);
            return 0; // or throw an error
        }
    
        const value = parseInt(timeParts[0], 10);
        const unit = timeParts[1].toLowerCase();
    
        let seconds = 0;
        if (unit.includes('second') || unit === 'sec') {
            seconds = value;
        } else if (unit.includes('minute') || unit === 'min') {
            seconds = value * 60;
        } else if (unit.includes('hour') || unit === 'hr') {
            seconds = value * 3600;
        }
    
        return seconds;
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

    ipcRenderer.on('set-time-and-reason', (event, { isReminder, time, reason }) => {
        ipcRenderer.send('console-log', `set-time-and-reason received with: ${JSON.stringify({ isReminder, time, reason })}`);

        
        if (!isReminder) return;
        
        ipcRenderer.send('console-log', `time: ${time}, reason: ${reason}`);
        const seconds = parseTime(time); // Parse "10 minutes" into 600 seconds
        ipcRenderer.send('console-log', `seconds parsed: ${seconds}`);
    
        // const formattedTime = formatTime(seconds); // Format 600 seconds into "10m"

    
        setTimeout(() => {
            if (Notification.permission === "granted") {
                new Notification(`Custom Reminder`, {
                    body: `Reminder: ${reason}`,
                    icon: 'assets/icon.ico'
                });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(`Break Reminder`, {
                            body: `Reminder: ${reason}`,
                            icon: 'assets/icon.ico'
                        });
                    }
                });
            }
        }, seconds * 1000); // Schedule the reminder after 600,000 milliseconds (10 minutes)
    });
});