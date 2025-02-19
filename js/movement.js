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
    // const idleAnimations = ['assets/dog/ball.gif', 'assets/dog/cold.gif', 'assets/dog/wink.gif', 'assets/dog/bored.gif'];
    const idleAnimations = ['assets/blobcat/idle.gif', 'assets/blobcat/random1.gif', 'assets/blobcat/random2.gif'];


    function getRandomIdleAnimation() {
        const randomIndex = Math.floor(Math.random() * idleAnimations.length);
        return idleAnimations[randomIndex];
    }

    function cursorMovement() {
        const rect = petContainer.getBoundingClientRect();
        const currentX = window.scrollX + rect.left + rect.width / 2;
        const currentY = window.scrollY + rect.top + rect.height / 2;

        const offsetY = 100; // Offset to keep the pet slightly below the cursor
        const deltaX = mouseX - currentX;
        const deltaY = mouseY - currentY + offsetY;

        // Calculate distance to the cursor
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        // Define constant speed
        const speed = 2; // Adjust this value for desired speed

        // Only move if the distance is greater than a small threshold
        if (distance > 5) {
            // Normalize the direction vector and scale by speed
            const directionX = (deltaX / distance) * speed;
            const directionY = (deltaY / distance) * speed;

            // Update position
            currentPosX += directionX;
            currentPosY += directionY;

            if (!isMoving) {
                isMoving = true;
                petImage.src = 'assets/blobcat/walk.gif'; // Walking animation
            }
        } else if (isMoving) {
            // Stop movement and switch to idle animation
            isMoving = false;
            petImage.src = getRandomIdleAnimation(); // Use random idle animation
        }

        // Apply updated position
        petContainer.style.transform = `translate(${currentPosX}px, ${currentPosY}px)`;

        // Continue animation loop
        requestAnimationFrame(cursorMovement);
    }

    function randomMovement() {
        let isWalking = false;
        let currentDirection = { x: 0, y: 0 };
        let currentWalkSpeed = 0;
        const padding = 20;
    
        function getRandomWalkSpeed() {
            return 0.5 + Math.random() * 1.5; // Adjusted speed range
        }
    
        function getRandomDirection() {
            const angle = Math.random() * 2 * Math.PI;
            return {
                x: Math.cos(angle),
                y: Math.sin(angle),
            };
        }
    
        function adjustDirectionIfNearBounds() {
            const rect = petContainer.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
    
            // Check if near the left or right boundary
            if (rect.left < padding) {
                currentDirection.x = Math.abs(currentDirection.x); // Move right
            } else if (rect.right > viewportWidth - padding) {
                currentDirection.x = -Math.abs(currentDirection.x); // Move left
            }
    
            // Check if near the top or bottom boundary
            if (rect.top < padding) {
                currentDirection.y = Math.abs(currentDirection.y); // Move down
            } else if (rect.bottom > viewportHeight - padding) {
                currentDirection.y = -Math.abs(currentDirection.y); // Move up
            }
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
            currentDirection = getRandomDirection();
            adjustDirectionIfNearBounds(); // Ensure direction is adjusted if near bounds
    
            currentWalkSpeed = getRandomWalkSpeed();
    
            isWalking = true;
            isMoving = true;
            petImage.src = 'assets/blobcat/walk.gif';
    
            const walkDuration = 1000 + Math.random() * 3000; // Adjusted walk duration
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
        }, 3000 + Math.random() * 5000); // Adjusted interval
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