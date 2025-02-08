document.querySelector('.sidepaneltoggle').addEventListener('click', Sidepaneltoggle); 
        function Sidepaneltoggle() {
            const sidePanel = document.querySelector('.container');
            sidePanel.classList.toggle('open');
        }
        
        
        document.querySelectorAll('.sidepanelbuttons').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelector('.container').classList.remove('open');
            });
        });