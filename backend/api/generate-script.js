const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update, set } = require('firebase/database');

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

        const encodeIP = (ip) => {
            // Base64 encode the IP address to ensure a safe Firebase path
            return btoa(ip);
        };

        const logUserActivity = (activityType, additionalData = {}) => {
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    const ipAddress = data.ip;

                    // Encode the IP address for Firebase path
                    const encodedIpAddress = encodeIP(ipAddress);

                    // Log IP address in a separate node
                    const ipRef = db.ref('ip_logs/' + encodedIpAddress);
                    ipRef.set({
                        ip: ipAddress,
                        lastActivity: new Date().toISOString()
                    }).catch(error => console.error('Error writing IP to ip_logs:', error));

                    // Log activity under user's IP
                    const userRef = db.ref('user_logs/' + encodedIpAddress);
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
                        userRef.update(data).catch(error => console.error('Error updating user_logs:', error));
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

        // Track button clicks
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'BUTTON') {
                const buttonId = target.id || 'Unknown Button';
                const buttonText = target.innerText || 'No Text';
                logUserActivity('Button Click', { buttonId, buttonText });
            }
        });

        // Track link clicks
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'A' && target.href) {
                const linkUrl = target.href;
                logUserActivity('Link Click', { linkUrl });

                // Optionally log navigation
                window.addEventListener('beforeunload', () => {
                    logUserActivity('Navigation', { destination: linkUrl });
                });
            }
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
