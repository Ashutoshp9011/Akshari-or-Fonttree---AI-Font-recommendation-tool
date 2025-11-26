let activeTabId = null;

// Get active tab when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
        activeTabId = tabs[0].id;
    }
});

// Listen for messages only from active tab
chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.action === "sendType" && sender.tab && sender.tab.id === activeTabId) {
        document.getElementById("detectedType").innerText = msg.data;
    }
});
