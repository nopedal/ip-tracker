document.getElementById('generate-script-btn').addEventListener('click', function() {
    // Send a request to the server to generate the script
    console.log('Sending request to the backend...');
    fetch('https://ip-tracker-backend.vercel.app/api/generate-script')
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Script generated:', data);
            // Display the generated script in the output container
            const scriptContainer = document.getElementById('generated-script');
            scriptContainer.textContent = data.script;
        })
        .catch(error => {
            console.error('Error generating script:', error);
        });
});
