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
    appId: "1:352009f74631115cddfcd7",
    measurementId: "G-RZKLS087CN",
};

const appFirebase = initializeApp(firebaseConfig);
const db = getDatabase(appFirebase);

// Allow CORS
app.use(cors());

// Function to fetch company data from Snitcher
const fetchCompanyData = async (ipAddress) => {
    try {
        const response = await axios.get(`https://api.apify.org/v2/ip/${ipAddress}?fields=company`, {
            headers: {
                'Authorization': 'Bearer YOUR_SNITCHER_API_TOKEN',
            },
        });
        const data = response.data;
        return {
            companyName: data.company?.name || 'Unknown',
            companyLogo: data.company?.logo || null,
            companyUrl: data.company?.url || null,
        };
    } catch (error) {
        console.error('Error fetching company data:', error.message);
        return { companyName: 'Unknown', companyLogo: null, companyUrl: null };
    }
};

// API route to generate the script
app.get('/api/generate-script', (req, res) => {
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
                const response = await fetch('https://api.apify.org/v2/ip/' + ipAddress + '?fields=company');
                if (response.ok) {
                    const data = await response.json();
                    return {
                        companyName: data.company?.name || 'Unknown',
                        companyLogo: data.company?.logo || null,
                        companyUrl: data.company?.url || null,
                    };
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

            // Fetch company data
            const companyData = await fetchCompanyData(ipAddress);

            const clickData = {
                clickedElement,
                pageUrl,
                companyName: companyData.companyName || 'Unknown',
                timestamp,
            };

            // Log click event
            await db.ref('clicks/' + encodedIp).push(clickData);
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
                        const clickedElement = event.target.tagName;
                        logClickEvent(ipAddress, clickedElement, pageUrl);
                    });
                });
            } catch (error) {
                console.error('Error initializing tracking:', error);
            }
        });
    </script>`;
    res.status(200).json({ script });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
