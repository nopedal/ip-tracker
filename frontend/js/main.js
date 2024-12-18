document.getElementById('generate-script-btn').addEventListener('click', function() {
    console.log('Sending request to the backend...'); 
    fetch('https://ip-tracker-backend.vercel.app/api/generate-script')
        .then(response => {
            console.log('Response status:', response.status); 
            return response.json(); 
        })
        .then(data => { 
            console.log('Script generated:', data);
            const scriptContainer = document.getElementById('generated-script'); // generate script in a sigma way if u know what i mean
            scriptContainer.textContent = data.script;
        })
        .catch(error => {
            console.error('Error generating script:', error);
        });
});
