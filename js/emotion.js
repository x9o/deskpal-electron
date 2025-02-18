const { ipcRenderer } = require('electron');
const caption = document.getElementById('caption');

// Array of messages for "sad" emotion
const sadMessages = [
    "You seem sad! I'm here to cheer you up!",
    "You seem sad!  It's okay to feel down sometimes. I'm here for you!",
    "You seem sad!  Let’s turn that frown upside down!",
    "You seem sad!  You’re stronger than you think. Keep going!",
    "You seem sad!  Remember, every cloud has a silver lining!",
    "You seem sad!  I’m here to brighten your day!",
    "You seem sad!  You’re not alone. I’m always by your side!",
    "You seem sad!  Take a deep breath. Things will get better!",
    "You seem sad!  You’ve got this! I believe in you!",
    "You seem sad!  Let’s find something to smile about!",
    "You seem sad!  You’re amazing, even on tough days!",
    "You seem sad!  It’s okay to take a break. You deserve it!",
    "You seem sad!  You’re doing great, even if it doesn’t feel like it!",
    "You seem sad!  Let’s focus on the good things today!",
    "You seem sad!  You’re loved and appreciated more than you know!",
    "You seem sad!  Every day is a new chance to feel better!",
    "You seem sad!  You’re capable of overcoming anything!",
    "You seem sad!  Let’s do something fun to lift your spirits!",
    "You seem sad!  You’re not alone in this. I’m here for you!",
    "You seem sad!  You’re doing better than you think. Keep going!"
];

// Array of messages for "happy" emotion
const happyMessages = [
    "You seem happy! What's on your mind?",
    "You seem happy! Your smile is contagious! Keep shining!",
    "You seem happy! It’s great to see you so happy!",
    "You seem happy! You’re radiating positivity today!",
    "You seem happy! What’s making you so happy? Tell me more!",
    "You seem happy! Your happiness makes me happy too!",
    "You seem happy! Let’s celebrate this good mood!",
    "You seem happy! You’re glowing with joy today!",
    "You seem happy! Keep up the great vibes!",
    "You seem happy! You’re unstoppable when you’re happy!",        
    "You seem happy! Your happiness is inspiring!",
    "You seem happy! What a wonderful day to be happy!",
    "You seem happy! You’re doing amazing! Keep it up!",
    "You seem happy! Your joy is the best thing ever!",
    "You seem happy! Let’s make the most of this happy moment!",
    "You seem happy! You’re a ray of sunshine today!",
    "You seem happy! Your happiness is well-deserved!",
    "You seem happy! You’re making the world a better place with your smile!",
    "You seem happy! I love seeing you this happy!",
    "You seem happy! You’re on top of the world today!"
];

const nolti = new Audio("assets/noti.mp3");
// Function to get a random message from an array
function getRandomMessage(messages) {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
}

ipcRenderer.on('emotion-detected', (event, emotion) => {
    // Update the pet's behavior based on the emotion
    if (emotion === 'negative') {
        const message = getRandomMessage(sadMessages);
        ipcRenderer.send(
            'chat', 
            message, 
            "mU5dpDywZpb_2Uoe3zUvj4BunJu2nxZqU53Kav0OdSc", 
            "13fb2e9e-8328-4e26-b41a-fdcfa8e096d6"
        );

        

        // Listen for reply from chat API
        ipcRenderer.removeAllListeners('chat-reply');
        ipcRenderer.on('chat-reply', (event, { replyMessage, audioUrl }) => {      
            // setInterval(() => {
            //     nolti.play();
            // }, 500)
            const currentAudio = new Audio(audioUrl);
            currentAudio.play();
            caption.textContent = message;
            ipcRenderer.send('stop-cycling-interval');
        });
    } else if (emotion === 'happy') {
        // Display a random happy message
        const message = getRandomMessage(happyMessages);
        ipcRenderer.send(
            'chat', 
            message, 
            "mU5dpDywZpb_2Uoe3zUvj4BunJu2nxZqU53Kav0OdSc", 
            "13fb2e9e-8328-4e26-b41a-fdcfa8e096d6"
        );

        // Listen for reply from chat API
        ipcRenderer.removeAllListeners('chat-reply');
        ipcRenderer.on('chat-reply', (event, { replyMessage, audioUrl }) => {      
            // setInterval(() => {
            //     nolti.play();
            // }, 500)
            const currentAudio = new Audio(audioUrl);
            currentAudio.play();
            caption.textContent = message;
            ipcRenderer.send('stop-cycling-interval');
        });
    }
});