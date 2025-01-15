const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update, set } = require('firebase/database');
const axios = require('axios');

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

const SNITCHER_API_BASE = "https://app.snitcher.com/api/v2";
const SNITCHER_API_TOKEN = "35|q6azGtUq0zJOSeIrVltnADeZAVtO62gRAT5B0UR7";

async function snitcherApiRequest(endpoint, method = 'GET', data = null) {
    const url = `${SNITCHER_API_BASE}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${SNITCHER_API_TOKEN}`,
        'Accept': 'application/json'
    };

    try {
        const response = await axios({ url, method, headers, data });
        return response.data;
    } catch (error) {
        console.error(`Error in Snitcher API request: ${method} ${endpoint}`, error.message);
        throw error;
    }
}

module.exports = async (req, res) => {
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

        const encodeIP = (ip) => btoa(ip);

        const logUserActivity = async (activityType, additionalData = {}) => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                const ipAddress = data.ip;

                const encodedIpAddress = encodeIP(ipAddress);
                const ipRef = db.ref('ip_logs/' + encodedIpAddress);

                await ipRef.set({
                    ip: ipAddress,
                    lastActivity: new Date().toISOString()
                });

                const userRef = db.ref('user_logs/' + encodedIpAddress);
                const snapshot = await userRef.once('value');
                const userData = snapshot.val() || {};

                if (!userData[sessionKey]) {
                    userData[sessionKey] = { activities: [] };
                }
                userData[sessionKey].activities.push({
                    type: activityType,
                    page: window.location.href,
                    timestamp: new Date().toISOString(),
                    ...additionalData
                });

                await userRef.update(userData);

                // Fetch leads from Snitcher for enhanced tracking
                const leadsData = await fetchSnitcherLeads();
                console.log('Leads Data:', leadsData);
            } catch (error) {
                console.error('Error logging user activity:', error);
            }
        };

        const fetchSnitcherLeads = async () => {
            try {
                const response = await fetch('/snitcher/leads'); // Proxy endpoint
                return await response.json();
            } catch (error) {
                console.error('Error fetching Snitcher leads:', error);
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            const sessionStart = new Date().toISOString();
            sessionStorage.setItem('session_start', sessionStart);
            logUserActivity('Page Visit', { session_start: sessionStart });
        });

        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'BUTTON') {
                logUserActivity('Button Click', { buttonId: target.id, buttonText: target.innerText });
            }
        });
    </script>`;

    // Example backend usage of Snitcher API
    try {
        const websites = await snitcherApiRequest('/websites');
        console.log('Websites:', websites);
    } catch (error) {
        console.error('Error fetching websites:', error.message);
    }

    res.status(200).json({ script });
};
