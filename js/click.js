document.addEventListener('DOMContentLoaded', () => {
    const pet = document.getElementById('pet');
    const caption = document.getElementById('caption');
    const input = document.getElementById('input'); 
    const inputbox = document.getElementById('inputbox');
    const clickMsgs = [
        "You're doing amazing, keep it up!",
        "Remember to take breaks and stay hydrated!",
        "Hey! I hope you have a great day.",
        "I'm proud of you for working so hard today.",
        "Even small steps forward are progress. You’ve got this!",
        "Hey! How's your morning/day/evening going?",
        "Hey, don't forget to smile—it suits you!",
        "You're stronger than you think. Keep going!",
        "Hey! I just wanted to let you know that I'm thinking of you.",
        "It's okay to take it slow today. Be kind to yourself.",
        "Need a reminder? You're awesome!",
        "Mistakes are proof that you're trying. Keep learning!",
        "I'm here for you, cheering you on every step of the way!",
        "Take a deep breath. You’re doing just fine.",
        "You're capable of amazing things. Keep believing in yourself!",
        "Don't forget to stretch! Your body will thank you.",
        "You deserve kindness, especially from yourself.",
        "Hey! I think you're doing a fantastic job!",
        "Everything will work out. Trust the process.",
        "You're so much more resilient than you realize!",
        "Hey! Are you taking care of yourself? I hope so!",
        "I hope you're proud of how far you’ve come.",
        "It’s okay to rest. You’ve earned it.",
        "No pressure, but I believe in you!",
        "You're glowing with potential today!",
        "Every effort you make is worth it. Keep going!",
        "Hey, it’s okay to ask for help if you need it.",
        "Your hard work will pay off. Trust yourself!",
        "Celebrate the little wins—they matter too!",
        "Hey! I hope you've had a little fun today.",
        "You’re a joy to have around. Never forget that!",
        "Don’t forget: progress, not perfection.",
        "You’re not alone. I’m right here with you!",
        "You’re doing better than you think you are.",
        "Your kindness makes the world a better place.",
        "Hey! I just wanted to say thank you for being you.",
        "Look how far you’ve come already. Keep it up!",
        "You make today brighter just by being you.",
        "I believe in you, even when you’re doubting yourself.",
        "Hey! You're amazing and deserve all the good things in life.",
        "It’s okay to feel overwhelmed. I'm here to help you through it.",
        "Your efforts are inspiring. Keep shining!",
        "Every day is another chance to start fresh. You’ve got this!",
        "You’re so talented. Don’t give up on your dreams!",
        "Take a moment to appreciate how awesome you are.",
        "Keep being your wonderful self. You’re incredible!",
        "You’ve faced challenges before, and you’ve overcome them. You can do it again!",
        "Hey! Don't forget to take a deep breath and relax.",
        "Your happiness matters. Don’t forget to take care of yourself.",
        "Hey! Chat to me if you need to. I’m always here for you.",
        "You’re building something amazing, one step at a time.",
        "It’s okay if today feels tough. You’re tougher!",
        "I’m so proud of you for showing up today.",
        "Have you smiled today? I hope so!",
        "Hey! If you need a friend, I'm always here to listen.",
        "You inspire me to cheer even louder for you.",
        "Hey! I’m always here to support you!",
        "You’ve made it through every tough day so far—you’ll make it through this one too.",
        "You make the world brighter just by being in it.",
        "Keep going, one step at a time. You’re doing great!"
    ]
    const speechbubble = document.getElementById('speechbubble');
    const settings = require('./settings.json');
    const { ipcRenderer } = require('electron');

    const idleAnimations = ['assets/dog/ball.gif', 'assets/dog/anger.gif', 'assets/dog/wink.gif', 'assets/dog/bored.gif', 'assets/dog/whatsup.gif', 'assets/dog/up-balloon.gif'];

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

    function startCyclingInterval() {
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
        }, 20000); // Cycle every 20 seconds
    }

    function stopCyclingInterval() {
        if (cyclingInterval) {
            clearInterval(cyclingInterval);
            cyclingInterval = null;
        }
    }

    startCyclingInterval();

    pet.addEventListener('click', () => {
        if (settings['pet-click-action'] === 'chat') {
            input.style.visibility = 'visible';   
            
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    ipcRenderer.send('chat', inputbox.value, '2rkbtvJYU45f6nVcrlfPlPpMDKXeRbusqadaYwCCA8w', '90bd3386-10b3-4ac6-baa4-fc2ecfbdd702');
                    console.log(inputbox.value)
                    input.style.visibility = 'hidden';
                    
                    speechbubble.style.visibility = 'visible';
                    pet.src = 'assets/dog/interogative.gif';
                    
                    // Stop cycling when a chat is initiated
                    stopCyclingInterval();
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
                inputbox.value = '';
                caption.textContent = replyMessage;
                speechbubble.style.visibility = 'hidden';

                // Stop cycling when a chat reply is received
                stopCyclingInterval();

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

                // Resume cycling after 10 seconds
                setTimeout(() => {
                    startCyclingInterval();
                }, 5000); // 10-second delay before resuming
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