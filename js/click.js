document.addEventListener('DOMContentLoaded', () => {
    const pet = document.getElementById('pet');
    const caption = document.getElementById('caption');
    const input = document.getElementById('input'); 
    const inputbox = document.getElementById('inputbox');
    const clickMsgs = ['walk me please! walk me!', 'where is dad?', 'how are you', '"i want to go for a walk', "i'd like some food now"];   
    const speechbubble = document.getElementById('speechbubble');
    const settings = require('./settings.json');
    const { ipcRenderer } = require('electron');

    const idleAnimations = ['assets/dog/ball.gif', 'assets/dog/anger.gif', 'assets/dog/wink.gif', 'assets/dog/bored.gif'];

    function getRandomIdleAnimation() {
        const randomIndex = Math.floor(Math.random() * idleAnimations.length);
        return idleAnimations[randomIndex];
    }
    
    let lastMsg = '';
    let lastAnimation = '';
    let cyclingInterval = null;

    pet.addEventListener('mouseover', () => {
        ipcRenderer.send('mouse-over-pet');
    });

    input.addEventListener('mouseover', () => {
        ipcRenderer.send('mouse-over-pet');
    });

    pet.addEventListener('mouseleave', () => {
        ipcRenderer.send('mouse-leave-pet');
    });

    input.addEventListener('mouseleave', () => {
        ipcRenderer.send('mouse-leave-pet');
    });

    cyclingInterval = setInterval(() => {
        // Randomly select a new message
        let msg;
        do {
            msg = clickMsgs[Math.floor(Math.random() * clickMsgs.length)];
        } while (msg === lastMsg); // Ensure the message is not the same as the last one
        caption.textContent = msg;
        lastMsg = msg; 

        // Randomly select a new idle animation
        let animation;
        do {
            animation = getRandomIdleAnimation();
        } while (animation === lastAnimation); // Ensure the animation is not the same as the last one
        pet.src = animation;
        lastAnimation = animation;
    }, 8000);

    pet.addEventListener('click', () => {
        if (settings['pet-click-action'] === 'chat') {
            input.style.visibility = 'visible';   
            
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    ipcRenderer.send('chat', inputbox.value);
                    input.style.visibility = 'hidden';
                    inputbox.value = '';
                    speechbubble.style.visibility = 'visible';
                    pet.src = 'assets/dog/interogative.gif';
                    
                    // Stop cycling when a chat is initiated
                    if (cyclingInterval) {
                        clearInterval(cyclingInterval);
                        cyclingInterval = null;
                    }
                }
            });

            let currentAudio = null;

            // Remove any existing listeners to prevent duplicate callbacks
            ipcRenderer.removeAllListeners('chat-reply');

            // Attach the listener
            ipcRenderer.on('chat-reply', (event, { replyMessage, audioUrl }) => {
                if (settings['pet-movement-mode'] === 'idle') {
                    pet.src = getRandomIdleAnimation();
                }
                caption.textContent = replyMessage;
                speechbubble.style.visibility = 'hidden';

                // Stop cycling when a chat reply is received
                if (cyclingInterval) {
                    clearInterval(cyclingInterval);
                    cyclingInterval = null;
                }

                if (audioUrl) {
                    // If there is already an audio playing, pause it
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                    }

                    // Create a new audio object and store it in currentAudio
                    currentAudio = new Audio(audioUrl);
                    currentAudio.play().catch((error) => {
                        console.error('Error while playing audio:', error);
                    });
                }
            });

        } else if (settings['pet-click-action'] === 'message') {
            let msg;
            do {
                msg = clickMsgs[Math.floor(Math.random() * clickMsgs.length)];
            } while (msg === lastMsg); 

            caption.textContent = msg;            
            lastMsg = msg; 
        }
    });
});