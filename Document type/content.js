function getDocumentTypeFromTitle() {
    const title = document.title;
    if (!title) return null;

    const parts = title.split("-");
    return parts[parts.length - 1].trim();
}

setInterval(() => {
    const docType = getDocumentTypeFromTitle();
    if (docType) {
        chrome.runtime.sendMessage({
            action: "sendType",
            data: docType
        });
    }
}, 3000);
