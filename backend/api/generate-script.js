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
    res.setHeader("Access-Control-Allow-Origin", "*");

    const script = `
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js"></script>
    <script>
        const firebaseConfig = ${JSON.stringify(firebaseConfig)};
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        const db = firebase.database();
        const logUserActivity = (activity) => {
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    const ipAddress = data.ip;
                    db.ref('user_logs').push({
                        ip: ipAddress,
                        activity: activity,
                        page: window.location.href,
                        timestamp: new Date().toISOString()
                    });
                })
                .catch(error => console.error('Error fetching IP address:', error));
        };

        document.addEventListener('DOMContentLoaded', () => {
            logUserActivity('Page Visit');
        });

        document.addEventListener('click', (event) => {
            logUserActivity('Click Event');
        });

        document.addEventListener('scroll', () => {
            logUserActivity('Scroll Event');
        });
    </script>`;
    
    res.status(200).json({ script });
};
