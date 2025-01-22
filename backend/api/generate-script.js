const express = require('express');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, push } = require('firebase/database');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDkPQPzhbCtPxR9Dh5p76hE-b3sr0jA",
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

const SNITCHER_API_BASE = "https://app.snitcher.com/api/v2";
const SNITCHER_API_TOKEN = "35|q6azGtUq0zJOSeIrVltnADeZAVtO62gRAT5B0UR7";

// API route to generate the script
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

            // Define fetchCompanyData on the client
            const fetchCompanyData = async (ipAddress) => {
                try {
                    const response = await fetch(\`${SNITCHER_API_BASE}/ip/\${ipAddress}\`, {
                        headers: {
                            'Authorization': 'Bearer ${SNITCHER_API_TOKEN}',
                            'Accept': 'application/json'
                        }
                    });
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

                const companyData = await fetchCompanyData(ipAddress);

                const pageRef = db.ref('pages/' + encodedIp);
                const existingPagesSnapshot = await pageRef.get();
                const existingPages = existingPagesSnapshot.val() || [];

                existingPages.push({ pageUrl, timestamp, companyData });
                await pageRef.set(existingPages);

                console.log('Page visit logged:', { pageUrl, timestamp, companyData });
            };

            const logClickEvent = (ipAddress, clickedElement) => {
                const timestamp = new Date().toISOString();
                const encodedIp = btoa(ipAddress);

                const clickData = {
                    clickedElement,
                    timestamp,
                };

                db.ref('clicks/' + encodedIp).push(clickData);
                console.log('Click event logged:', clickData);
            };

            const logConversion = async (ipAddress, conversionType) => {
                const timestamp = new Date().toISOString();
                const encodedIp = btoa(ipAddress);

                const conversionData = {
                    conversionType,
                    timestamp,
                };

                await db.ref('conversions/' + encodedIp).push(conversionData);
                console.log('Conversion logged:', conversionData);
            };

            document.addEventListener('DOMContentLoaded', async () => {
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    const ipAddress = data.ip;

                    const pageUrl = window.location.href;
                    await logPageVisit(ipAddress, pageUrl);

                    document.querySelectorAll('button, a, .clickable').forEach((element) => {
                        element.addEventListener('click', (event) => {
                            const clickedElement = event.target.tagName;
                            logClickEvent(ipAddress, clickedElement);
                        });
                    });

                    document.querySelectorAll('form').forEach((form) => {
                        form.addEventListener('submit', () => {
                            logConversion(ipAddress, 'Form Submission');
                        });
                    });

                    document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((link) => {
                        link.addEventListener('click', () => {
                            logConversion(ipAddress, 'Phone/Email Click');
                        });
                    });

                    if (pageUrl.includes('thank-you')) {
                        await logConversion(ipAddress, 'Thank You Page');
                    }
                } catch (error) {
                    console.error('Error initializing tracking:', error);
                }
            });
        </script>`;

        res.status(200).json({ script });
    } catch (error) {
        console.error('Error generating script:', error.message);
        res.status(500).json({ error: 'Failed to generate script.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
