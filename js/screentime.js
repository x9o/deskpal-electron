document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer, remote } = require('electron');
    const caption = document.getElementById('caption');
    const pet = document.getElementById('pet');
    const settings = require('./settings.json');

    const windowTimes = {};
    const reminderThreshold = [1800, 3600, 7200]; 
    const nolti = new Audio("assets/noti.mp3");

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
        if (unit.includes('second') || unit === 'sec' || unit === 'secs') {
            seconds = value;
        } else if (unit.includes('minute') || unit === 'min' || unit === 'mins') {
            seconds = value * 60;
        } else if (unit.includes('hour') || unit === 'hr' || unit === 'hrs') {
            seconds = value * 3600;
        }
    
        return seconds;
    }
    function showReminder(title, timeElapsed) {
        // Send reminder message to the Flask API for chat
        ipcRenderer.send(
            'chat', 
            `Hey! You've been using ${title} for ${timeElapsed} seconds! Take a break if you need to!`, 
            "mU5dpDywZpb_2Uoe3zUvj4BunJu2nxZqU53Kav0OdSc", 
            "13fb2e9e-8328-4e26-b41a-fdcfa8e096d6"
        );

        // Listen for reply from chat API
        ipcRenderer.removeAllListeners('chat-reply');
        ipcRenderer.on('chat-reply', (event, { replyMessage, audioUrl }) => {
            caption.innerHTML = `Hey! You've been using <span style="color: green;">${title}</span> for <span style="color: blue;">${timeElapsed}</span>!<br>` +
                                `Take a break if you need to!`;
            ipcRenderer.send('stop-cycling-interval');
            // pet.src = 'assets/dog/anger.gif';
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

    ipcRenderer.removeAllListeners('set-time-and-reason');
    ipcRenderer.on('set-time-and-reason', (event, { isReminder, isSleepy, reminderReason, timeSpecification }) => {
        ipcRenderer.send('console-log', `set-time-and-reason received with: ${JSON.stringify({ isReminder, isSleepy, reminderReason, timeSpecification })}`);

        
        if (!isReminder) return;
        
        ipcRenderer.send('console-log', `time: ${timeSpecification}, reason: ${reminderReason}`);
        const seconds = parseTime(timeSpecification); // Parse "10 minutes" into 600 seconds
        ipcRenderer.send('console-log', `seconds parsed: ${seconds}`);
    
        // const formattedTime = formatTime(seconds); // Format 600 seconds into "10m"
        
        
        
        setTimeout(() => {
            ipcRenderer.send(
                'chat', 
                `Custom reminder: ${reminderReason}`, 
                "mU5dpDywZpb_2Uoe3zUvj4BunJu2nxZqU53Kav0OdSc", 
                "13fb2e9e-8328-4e26-b41a-fdcfa8e096d6"
            );
    
            // Listen for reply from chat API
            ipcRenderer.removeAllListeners('chat-reply');
            ipcRenderer.once('chat-reply', (event, { replyMessage, audioUrl }) => {
                // setInterval(() => {
                //     nolti.play();
                // }, 500);
                caption.textContent = "Custom reminder: " + reminderReason;
                ipcRenderer.send('stop-cycling-interval');

                const currentAudio = new Audio(audioUrl);
                currentAudio.play();

                if (Notification.permission === "granted") {
                    new Notification(`Custom Reminder`, {
                        body: `Reminder: ${reminderReason}`,
                        icon: 'assets/icon.ico'
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification(`Break Reminder`, {
                                body: `Reminder: ${reminderReason}`,
                                icon: 'assets/icon.ico'
                            });
                        }
                    });
                }
            
            });


            
        }, seconds * 1000); // Schedule the reminder after 600,000 milliseconds (10 minutes)
    });
});