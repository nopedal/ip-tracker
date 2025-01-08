const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');

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

        const sanitizePath = (str) => {
            // Replace invalid characters with underscores
            return str.replace(/[.#$\[\]]/g, '_');
        };

        const logUserActivity = (activityType, additionalData = {}) => {
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    const ipAddress = data.ip;

                    // Sanitize the IP address for Firebase path
                    const sanitizedIpAddress = sanitizePath(ipAddress);

                    const userRef = db.ref('user_logs/' + sanitizedIpAddress);
                    userRef.once('value').then(snapshot => {
                        const data = snapshot.val() || {};
                        if (!data[sessionKey]) {
                            data[sessionKey] = { activities: [] };
                        }
                        data[sessionKey].activities.push({
                            type: activityType,
                            page: window.location.href,
                            timestamp: new Date().toISOString(),
                            ...additionalData
                        });

                        // Update Firebase
                        userRef.update(data);
                    });
                })
                .catch(error => console.error('Error fetching IP address:', error));
        };

        // Track page visits
        document.addEventListener('DOMContentLoaded', () => {
            const sessionStart = new Date().toISOString();
            sessionStorage.setItem('session_start', sessionStart);
            logUserActivity('Page Visit', { session_start: sessionStart });
        });

        // Track clicks
        document.addEventListener('click', () => {
            logUserActivity('Click Event');
        });

        // Track form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            const formId = form.id || 'Unknown Form';
            logUserActivity('Form Submission', { formId });
        });

        // Track "Thank You" page visit
        if (window.location.href.includes('thank-you')) {
            logUserActivity('Thank You Page');
        }

        // Track session duration and bounce
        window.addEventListener('beforeunload', () => {
            const sessionStart = sessionStorage.getItem('session_start');
            const sessionEnd = new Date().toISOString();
            const sessionDuration = sessionStart ? (new Date(sessionEnd) - new Date(sessionStart)) / 1000 : null;

            if (sessionDuration && sessionDuration < 10) {
                logUserActivity('Bounce', { sessionDuration });
            } else {
                logUserActivity('Session End', { session_end: sessionEnd, sessionDuration });
            }
        });
    </script>`;
    
    res.status(200).json({ script });
};
