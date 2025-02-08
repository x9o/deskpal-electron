document.addEventListener('DOMContentLoaded', () => {
    const pet = document.getElementById('pet');
    const caption = document.getElementById('caption');
    const input = document.getElementById('input'); 
    const inputbox = document.getElementById('inputbox');
    const clickMsgs = ['Wave', 'You clicked me! ^_^', 'Hi!', 'Hello!'];   
    const speechbubble = document.getElementById('speechbubble');
    const settings = require('./settings.json');
    const { ipcRenderer } = require('electron');
    
    let lastMsg = '';

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

    pet.addEventListener('click', () => {
        if (settings['pet-click-action'] === 'chat') {
            input.style.visibility = 'visible';   
                  
            
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    ipcRenderer.send('chat', inputbox.value);
                    input.style.visibility = 'hidden';
                    inputbox.value = '';
                    speechbubble.style.visibility = 'visible';

                    
                }
            });

            ipcRenderer.on('chat-reply', (event, replyMessage) => {
                caption.textContent = replyMessage;
                speechbubble.style.visibility = 'hidden';

                
            });
        
        } else if (settings['pet-click-action'] === 'message') {
            let msg;
            do {
                msg = clickMsgs[Math.floor(Math.random() * clickMsgs.length)];
            } while (msg === lastMsg); 

            caption.textContent = msg;
            
            lastMsg = msg; 
        };
        
        // pet.src = 'assets/dragon_clicked.gif';

        // setTimeout(() => {
        //     pet.src = 'assets/dragon_idle.gif';
        // }, 800);
    });
});