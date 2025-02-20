document.addEventListener('DOMContentLoaded', () => {
    const petContainer = document.getElementById('pet-container');
    const images = petContainer.querySelectorAll('img'); // Get all images in the container
    const pet = document.getElementById('pet');
    const settings = require('./settings.json');

    if (settings['pet-movement-mode'] === 'cursor' || settings['pet-movement-mode'] === 'random') {
        return;
    }

    let isDragging = false; // Track dragging state
    let startX, startY, initialX, initialY; // Store positions

    // Prevent default drag behavior for images
    images.forEach((image) => {
        image.addEventListener('dragstart', (event) => {
            event.preventDefault(); // Prevent dragging the image itself
        });
    });

    // Ensure initial position is set explicitly
    const ensureInitialPosition = () => {
        const rect = petContainer.getBoundingClientRect();
        if (!petContainer.style.left || !petContainer.style.top) {
            petContainer.style.left = `${rect.left}px`;
            petContainer.style.top = `${rect.top}px`;
        }
    };

    // When the mouse is pressed down
    petContainer.addEventListener('mousedown', (event) => {
        ensureInitialPosition(); // Set initial position if not already set
        isDragging = true;
        pet.src = 'assets/blobcat/random1.gif';

        // Record the starting mouse position
        startX = event.clientX;
        startY = event.clientY;

        // Get the current position of the pet container
        initialX = parseInt(petContainer.style.left, 10);
        initialY = parseInt(petContainer.style.top, 10);

        petContainer.style.cursor = 'grabbing';
    });

    // When the mouse is moved
    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            // Calculate the new position
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            // Apply the new position
            const newX = initialX + dx;
            const newY = initialY + dy;

            petContainer.style.left = `${newX}px`;
            petContainer.style.top = `${newY}px`;
        }
    });

    // When the mouse is released
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false; // Stop dragging
            pet.src = `assets/blobcat/idle.gif?timestamp=${Date.now()}`;
            petContainer.style.cursor = 'grab'; // Reset cursor
        }
    });
});