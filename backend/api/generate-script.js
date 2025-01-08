const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, update } = require('firebase/database');
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const script = `
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>

    <script>
        const firebaseConfig = ${JSON.stringify(firebaseConfig)};
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        const db = firebase.database();
        const sessionKey = sessionStorage.getItem('sessionKey') || 'session_' + Date.now();
        sessionStorage.setItem('sessionKey', sessionKey);

        const logUserActivity = (activityType) => {
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    const ipAddress = data.ip.replace(/\./g, '_');

                    const userRef = db.ref('user_logs/' + ipAddress);
                    userRef.once('value').then(snapshot => {
                        const data = snapshot.val() || {};
                        if (!data[sessionKey]) {
                            data[sessionKey] = { activities: [], lastActivity: null };
                        }

                        const activity = {
                            type: activityType,
                            page: window.location.href,
                            timestamp: new Date().toISOString()
                        };

                        data[sessionKey].activities.push(activity);
                        data[sessionKey].lastActivity = new Date().toISOString();

                        userRef.update(data);
                    });
                })
                .catch(error => console.error('Error fetching IP address:', error));
        };

        const setSessionTimeout = () => {
            setTimeout(() => {
                sessionStorage.removeItem('sessionKey');
            }, 30 * 60 * 1000); // Timeout after 30 minutes of inactivity
        };

        document.addEventListener('DOMContentLoaded', () => {
            logUserActivity('Page Visit');
            setSessionTimeout();
        });

        document.addEventListener('click', () => {
            logUserActivity('Click Event');
        });

        const observeFormSubmissions = () => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', () => {
                    logUserActivity('Form Submission');
                });
            });
        };

        observeFormSubmissions();
    </script>`;

    res.status(200).json({ script });
};
