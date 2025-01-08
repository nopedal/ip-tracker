document.getElementById('generate-script-btn').addEventListener('click', function() {
    console.log('Sending request to the backend...');

    // Show loading spinner
    const scriptContainer = document.getElementById('generated-script');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.classList.add('loading-spinner');
    scriptContainer.innerHTML = ''; // Clear previous content
    scriptContainer.appendChild(loadingSpinner);

    // Fetch the script from the backend
    fetch('https://ip-tracker-backend.vercel.app/api/generate-script')
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Script generated:', data);

            // Remove loading spinner
            loadingSpinner.style.display = 'none';

            // Append the generated script dynamically with smooth transition
            const generatedScriptBlock = document.createElement('pre');
            generatedScriptBlock.classList.add('generated-script');
            generatedScriptBlock.textContent = data.script; // Use textContent for better security
            scriptContainer.appendChild(generatedScriptBlock);

            // Add smooth fade-in effect for generated script
            generatedScriptBlock.style.opacity = 0;
            setTimeout(() => {
                generatedScriptBlock.style.transition = 'opacity 0.5s ease-in';
                generatedScriptBlock.style.opacity = 1;
            }, 10);
        })
        .catch(error => {
            console.error('Error generating script:', error);

            // Remove loading spinner
            loadingSpinner.style.display = 'none';

            // Show error message with smooth transition
            const errorMessage = document.createElement('div');
            errorMessage.classList.add('error');
            errorMessage.textContent = 'Failed to generate the script. Please try again later.';
            scriptContainer.appendChild(errorMessage);

            // Add smooth fade-in effect for error message
            errorMessage.style.opacity = 0;
            setTimeout(() => {
                errorMessage.style.transition = 'opacity 0.5s ease-in';
                errorMessage.style.opacity = 1;
            }, 10);
        });
});
