const express = require('express');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, push } = require('firebase/database');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDkPQPzhbCtPxR9Dh8Wv5p76hE-b3sr0jA",
    authDomain: "iptracker-d6aac.firebaseapp.com",
    projectId: "iptracker-d6aac",
    storageBucket: "iptracker-d6aac.firebasestorage.app",
    messagingSenderId: "352009531638",
    appId: "1:352009531638:web:50ef03f74631115cddfcd7",
    measurementId: "G-RZKLS087CN",
};

const appFirebase = initializeApp(firebaseConfig);
const db = getDatabase(appFirebase);

// Allow CORS
app.use(cors());

// Snitcher API configuration
const SNITCHER_API_BASE = "https://app.snitcher.com/api/v2";
const SNITCHER_API_TOKEN = "35|q6azGtUq0zJOSeIrVltnADeZAVtO62gRAT5B0UR7";

// Function to make API requests
async function snitcherApiRequest(endpoint, method = 'GET', data = null) {
    const url = `${SNITCHER_API_BASE}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${SNITCHER_API_TOKEN}`,
        'Accept': 'application/json',
    };

    try {
        const response = await axios({ url, method, headers, data });
        return response.data;
    } catch (error) {
        console.error(`Error in Snitcher API request: ${method} ${endpoint}`, error.message);
        throw error;
    }
}

// API route to fetch company data (proxy)
app.get('/api/company-data', async (req, res) => {
    const ipAddress = req.query.ip;
    try {
        const companyData = await snitcherApiRequest(`/ip/${ipAddress}`);
        res.json({
            companyName: companyData.company?.name || 'Unknown',
            companyLogo: companyData.company?.logo || null,
            companyUrl: companyData.company?.url || null,
        });
    } catch (error) {
        console.error('Error fetching company data:', error.message);
        res.status(500).json({ error: 'Failed to fetch company data' });
    }
});

// API route to generate the tracking script
app.get('/api/generate-script', async (req, res) => {
    try {
        const script = `
        <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>

        <script>
            const firebaseConfig = ${JSON.stringify(firebaseConfig)};
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            const db = firebase.database();

            const fetchCompanyData = async (ipAddress) => {
                try {
                    const response = await fetch('/api/company-data?ip=' + encodeURIComponent(ipAddress));
                    if (response.ok) {
                        return await response.json();
                    }
                    return { companyName: 'Unknown', companyLogo: null, companyUrl: null };
                } catch (error) {
                    console.error('Error fetching company data:', error);
                    return { companyName: 'Unknown', companyLogo: null, companyUrl: null };
                }
            };

            const logPageVisit = async (ipAddress, pageUrl) => {
                const timestamp = new Date().toISOString();
                const encodedIp = btoa(ipAddress);

                // Fetch company data
                const companyData = await fetchCompanyData(ipAddress);

                // Track page visits
                const pageRef = db.ref('pages/' + encodedIp);
                const existingPagesSnapshot = await pageRef.get();
                const existingPages = existingPagesSnapshot.val() || [];

                existingPages.push({ pageUrl, timestamp, companyData });
                await pageRef.set(existingPages);

                console.log('Page visit logged:', { pageUrl, timestamp, companyData });
            };

            const logClickEvent = async (ipAddress, clickedElement, pageUrl) => {
                const timestamp = new Date().toISOString();
                const encodedIp = btoa(ipAddress);

                // Extract meaningful details from the clicked element
                const elementDetails = clickedElement.textContent?.trim() ||
                                       clickedElement.getAttribute('aria-label') ||
                                       clickedElement.getAttribute('alt') ||
                                       clickedElement.tagName;

                const clickData = {
                    clickedElement: elementDetails,
                    pageUrl,
                    timestamp,
                };

                // Log click event
                db.ref('clicks/' + encodedIp).push(clickData);
                console.log('Click event logged:', clickData);
            };

            document.addEventListener('DOMContentLoaded', async () => {
                try {
                    // Get user's IP address
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    const ipAddress = data.ip;

                    // Log page visit
                    const pageUrl = window.location.href;
                    await logPageVisit(ipAddress, pageUrl);

                    // Track clicks on buttons, links, and clickable elements
                    document.querySelectorAll('button, a, .clickable').forEach((element) => {
                        element.addEventListener('click', (event) => {
                            const clickedElement = event.target;
                            logClickEvent(ipAddress, clickedElement, pageUrl);
                        });
                    });
                } catch (error) {
                    console.error('Error initializing tracking:', error);
                }
            });
        </script>`;

        res.status(200).json({ script });
    } catch (error) {
        console.error('Error generating script:', error.message);
        res.status(500).json({ error: 'Failed to generate the script.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
