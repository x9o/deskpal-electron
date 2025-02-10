document.addEventListener('DOMContentLoaded', () => {
    const petContainer = document.getElementById('pet-container');
    const petImage = document.getElementById('pet');
    let mouseX = 0;
    let mouseY = 0;
    let isMoving = false;
    let currentPosX = 0;
    let currentPosY = 0;


    const settings = require('./settings.json');
    // const pet = 'dog';
    // const movementmode = 'random';

    // Array of idle animations
    const idleAnimations = ['assets/dog/ball.gif', 'assets/dog/cold.gif', 'assets/dog/wink.gif'];

    function getRandomIdleAnimation() {
        const randomIndex = Math.floor(Math.random() * idleAnimations.length);
        return idleAnimations[randomIndex];
    }

    function cursorMovement() {
        const rect = petContainer.getBoundingClientRect();
        const currentX = window.scrollX + rect.left + rect.width / 2;
        const currentY = window.scrollY + rect.top + rect.height / 2;

        const deltaX = mouseX - currentX;
        const deltaY = mouseY - currentY;

        currentPosX += deltaX * 0.005;
        currentPosY += deltaY * 0.005;

        const isMovingNow = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5; // x or y bigger than 5 (boolean)

        if (isMovingNow !== isMoving) {
            isMoving = isMovingNow;
            petImage.src = isMoving ? 'assets/dog/bored.gif' : getRandomIdleAnimation(); // Use random idle animation
        }

        petContainer.style.transform = `translate(${currentPosX}px, ${currentPosY}px)`;
        requestAnimationFrame(cursorMovement);
    }

    function randomMovement() {
        let isWalking = false;
        let currentDirection = { x: 0, y: 0 };
        let currentWalkSpeed = 0;
        const padding = 20;

        function getRandomWalkSpeed() {
            return 0.2 + Math.random() * 1.1;
        }

        function keepInBounds() {
            const rect = petContainer.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (rect.left < padding) {
                currentPosX = padding;
                return false;
            }
            if (rect.right > viewportWidth - padding) {
                currentPosX = viewportWidth - rect.width - padding;
                return false;
            }

            if (rect.top < padding) {
                currentPosY = padding;
                return false;
            }
            if (rect.bottom > viewportHeight - padding) {
                currentPosY = viewportHeight - rect.height - padding;
                return false;
            }

            return true;
        }

        function startNewWalk() {
            const angle = Math.random() * 2 * Math.PI;

            currentDirection = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            currentWalkSpeed = getRandomWalkSpeed();

            isWalking = true;
            isMoving = true;
            petImage.src = 'assets/dog/bored.gif';

            const walkDuration = 2000 + Math.random() * 2000; // Random walk duration
            setTimeout(() => {
                isWalking = false;
                isMoving = false;
                petImage.src = getRandomIdleAnimation(); // Use random idle animation
            }, walkDuration);
        }

        function walk() {
            if (isWalking) {
                const prevPosX = currentPosX;
                const prevPosY = currentPosY;

                currentPosX += currentDirection.x * currentWalkSpeed;
                currentPosY += currentDirection.y * currentWalkSpeed;

                petContainer.style.transform = `translate(${currentPosX}px, ${currentPosY}px)`;

                if (!keepInBounds()) {
                    currentDirection.x *= -1;
                    currentDirection.y *= -1;
                    currentPosX = prevPosX;
                    currentPosY = prevPosY;
                }
            }
            requestAnimationFrame(walk);
        }

        startNewWalk();
        walk();

        setInterval(() => {
            if (!isWalking) {
                startNewWalk();
            }
        }, 5000 + Math.random() * 5000);
    }

    if (settings['pet-movement-mode'] === 'cursor') {
        document.addEventListener('mousemove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        cursorMovement();
    } else if (settings['pet-movement-mode'] === 'random') {
        randomMovement();
    }
});