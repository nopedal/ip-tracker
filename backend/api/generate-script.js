const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, update } = require('firebase/database');
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

async function fetchAndStoreLeadsWithPages(websiteId, pages) {
    try {
        // Fetch leads from Snitcher
        const leadsData = await snitcherApiRequest(`/websites/${websiteId}`);
        const leads = leadsData.data.map(lead => ({
            companyName: lead.company?.name || "Unknown",
            companyLogo: lead.company?.logo || null,
            companyUrl: lead.company?.url || null,
            reference: lead.reference || null,
            pages: pages || [],
            websiteId: websiteId
        }));

        if (leads.length > 0) {
            // Store leads in Firebase under the "leads" node
            const leadsRef = ref(db, `leads/${websiteId}`);
            await set(leadsRef, leads);

            console.log(`Leads and page data for website ${websiteId} have been stored in Firebase.`);
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

        // Function to log page visits
        const logPageVisit = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                const ipAddress = data.ip;

                const pageUrl = window.location.href;
                const timestamp = new Date().toISOString();
                const encodedIp = btoa(ipAddress);

                const pageRef = db.ref('pages/' + encodedIp);
                const existingPages = (await pageRef.once('value')).val() || [];

                // Update Firebase with the visited page
                existingPages.push({ pageUrl, timestamp });
                await pageRef.set(existingPages);

                console.log('Page visit logged:', { pageUrl, timestamp });
            } catch (error) {
                console.error('Error logging page visit:', error);
            }
        };

        document.addEventListener('DOMContentLoaded', logPageVisit);
    </script>`;

    try {
        // Fetch websites and leads
        const websitesData = await snitcherApiRequest('/websites');
        const websites = websitesData.data;

        if (websites && websites.length > 0) {
            for (const website of websites) {
                // Fetch pages for logging
                const pagesRef = ref(db, `pages/${website.id}`);
                const pagesSnapshot = await pagesRef.once('value');
                const pages = pagesSnapshot.val() || [];

                await fetchAndStoreLeadsWithPages(website.id, pages); // Fetch leads and attach pages data
            }
        }

        res.status(200).json({ script });
    } catch (error) {
        console.error('Error fetching websites or leads:', error.message);
        res.status(500).json({ error: 'An error occurred while processing leads and pages.' });
    }
};
