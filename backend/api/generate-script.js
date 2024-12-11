const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push } = require('firebase/database');
const cors = require('cors');

const firebaseConfig = {
    apiKey: "AIzaSyDkPQPzhbCtPxR9Dh8Wv5p76hE-b3sr0jA",
    authDomain: "iptracker-d6aac.firebaseapp.com",
    projectId: "iptracker-d6aac",
    storageBucket: "iptracker-d6aac.firebasestorage.app",
    messagingSenderId: "352009531638",
    appId: "1:352009531638:web:50ef03f74631115cddfcd7",
    measurementId: "G-RZKLS087CN"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = (req, res) => {
    // Enable CORS if needed
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Generate the script dynamically
    const script = `
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js"></script>
    <script>
        const firebaseConfig = ${JSON.stringify(firebaseConfig)};
        
        // Initialize Firebase on the client side
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Get IP Address and log it to Firebase
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

    // Send the script as a JSON response
    res.status(200).json({ script });
};
    