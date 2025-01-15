const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
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

async function fetchAndStoreLeads(websiteId) {
    try {
        // Fetch leads from Snitcher
        const leadsData = await snitcherApiRequest(`/websites/${websiteId}`);
        const leads = leadsData.data; // Adjust based on Snitcher response structure

        if (leads) {
            // Store leads in Firebase under the "leads" node
            const leadsRef = ref(db, `leads/${websiteId}`);
            await set(leadsRef, leads);

            console.log(`Leads for website ${websiteId} have been stored in Firebase.`);
        }
    } catch (error) {
        console.error('Error fetching or storing leads:', error.message);
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
            } catch (error) {
                console.error('Error logging user activity:', error);
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

    try {
        // Fetch websites and leads
        const websitesData = await snitcherApiRequest('/websites');
        const websites = websitesData.data;

        if (websites && websites.length > 0) {
            for (const website of websites) {
                await fetchAndStoreLeads(website.id); // Fetch leads for each website
            }
        }

        res.status(200).json({ script });
    } catch (error) {
        console.error('Error fetching websites or leads:', error.message);
        res.status(500).json({ error: 'An error occurred while processing leads.' });
    }
};
