const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const firebaseConfig = {
    apiKey: "AIzaSyDkPQPzhbCtPxR9Dh8Wv5p76hE-b3sr0jA",
    authDomain: "iptracker-d6aac.firebaseapp.com",
    projectId: "iptracker-d6aac",
    storageBucket: "iptracker-d6aac.firebasestorage.app",
    messagingSenderId: "352009531638",
    appId: "1:352009531638:web:50ef03f74631115cddfcd7",
    measurementId: "G-RZKLS087CN"
};

app.get('/generate-script', (req, res) => {
    // Generate a JavaScript tracking script dynamically
    const script = `
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js"></script>
    <script>
        // Firebase configuration
        const firebaseConfig = ${JSON.stringify(firebaseConfig)};
        
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Get IP Address
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                const ipAddress = data.ip;
                const db = firebase.database();
                db.ref('ip_logs').push({
                    ip: ipAddress,
                    timestamp: new Date().toISOString()
                });
            });
    </script>`;

    res.json({ script });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
