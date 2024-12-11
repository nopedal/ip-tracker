document.getElementById('generate-script-btn').addEventListener('click', function() {
    // Send a request to the server to generate the script
    fetch('https://ip-tracker-backend.vercel.app/api/generate-script')
        .then(response => response.json())
        .then(data => {
            // Display the generated script in the output container
            const scriptContainer = document.getElementById('generated-script');
            scriptContainer.textContent = data.script;
        })
        .catch(error => {
            console.error('Error generating script:', error);
        });
});
