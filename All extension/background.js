// --- File: background.js (Improved Error Handling) ---

const API_URL = 'http://localhost:3000/analyze-design';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendContentData") {
        const { docType, heading, fullText, usedFonts } = message.data;

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docType, heading, fullText, usedFonts }),
        })
        .then(response => {
            // --- THIS BLOCK IS NEW AND IMPROVED ---
            if (!response.ok) {
                // If we get a 400 or 500 error, try to read the JSON error message from the server
                return response.json().then(err => { 
                    // Throw an error with the specific message from the server
                    throw new Error(err.error || `HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(aiData => {
            const finalData = { docType, heading, ...aiData };
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "updateAnalyzedData",
                        data: finalData
                    });
                }
            });
        })
        .catch(error => {
            console.error("Error calling backend for analysis:", error);
             chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "analysisError",
                        error: error.message // This will now be the specific server error
                    });
                }
            });
        });
    }
    return true;
});