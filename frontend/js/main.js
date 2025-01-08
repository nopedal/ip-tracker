document.getElementById('generate-script-btn').addEventListener('click', function() {
    console.log('Sending request to the backend...');

    // Show loading spinner
    const scriptContainer = document.getElementById('generated-script');
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('loading');
    loadingMessage.textContent = 'Generating script... Please wait.';
    scriptContainer.innerHTML = ''; // Clear previous content
    scriptContainer.appendChild(loadingMessage);

    // Fetch the script from the backend
    fetch('https://ip-tracker-backend.vercel.app/api/generate-script')
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Script generated:', data);

            // Remove loading message
            loadingMessage.style.display = 'none';

            // Append the generated script dynamically in a nice way
            const generatedScriptBlock = document.createElement('pre');
            generatedScriptBlock.classList.add('generated-script');
            generatedScriptBlock.textContent = data.script; // or use innerHTML for richer content
            scriptContainer.appendChild(generatedScriptBlock);
        })
        .catch(error => {
            console.error('Error generating script:', error);

            // Show error message
            loadingMessage.style.display = 'none';
            const errorMessage = document.createElement('div');
            errorMessage.classList.add('error');
            errorMessage.textContent = 'Failed to generate the script. Please try again later.';
            scriptContainer.appendChild(errorMessage);
        });
});
