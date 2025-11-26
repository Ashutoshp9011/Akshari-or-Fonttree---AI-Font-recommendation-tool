// --- File: content.js (Final, Most Robust Version) ---

console.log("CANVA ANALYZER: content.js script loaded.");

function getDocumentTypeFromTitle() {
    const title = document.title;
    if (!title) return "Untitled Design";
    const parts = title.split("-");
    return parts[parts.length - 1].trim();
}

function extractTextWithSpaces(element) {
    if (!element) return '';
    const clone = element.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
}

// --- HEAVILY UPDATED FUNCTION ---
function extractAllTextAndFonts() {
    const selectors = 'span.a_GcMg, [data-testid*="text"], div[role="textbox"]';
    let elements = [...document.querySelectorAll(selectors)];
    let allText = [];
    const fontSet = new Set();
    const processedElements = new Set();

    // Primary method: Use specific selectors first
    elements.forEach(el => {
        if (processedElements.has(el)) return;
        const text = extractTextWithSpaces(el);
        if (text) {
            allText.push(text);
            const style = window.getComputedStyle(el);
            const fontFamily = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            if (fontFamily && fontFamily.toLowerCase() !== 'inherit') fontSet.add(fontFamily);
        }
        processedElements.add(el);
    });

    // --- FALLBACK METHOD: If the above found nothing, try a brute-force approach ---
    if (allText.length === 0) {
        console.warn("CANVA ANALYZER: Specific selectors failed. Trying brute-force fallback.");
        // This selector points to the main design canvas area
        const designCanvas = document.querySelector('div[data-testid="page-container"], .page');
        if (designCanvas) {
            // Use innerText which intelligently grabs all visible text content
            const bruteForceText = designCanvas.innerText;
            if (bruteForceText) {
                allText = bruteForceText.split('\n').filter(line => line.trim() !== '');
            }
        }
    }
    
    // Final check to ensure we send something the server can process
    const finalText = allText.length > 0 ? allText.join('\n') : "No text found on page.";

    return {
        fullText: finalText, // Renamed for clarity to match server expectation
        usedFonts: [...fontSet]
    };
}

// This function is fine, no changes needed from the robust version
function extractMainHeading() { /* ... same as previous robust version ... */ }
function extractMainHeading() {
    const elements = document.querySelectorAll('span.a_GcMg, [data-testid*="text"], div[role="textbox"] p, div[role="textbox"] span');
    let headings = [];
    if (elements.length === 0) return "Not detected";
    
    elements.forEach(el => {
        const text = extractTextWithSpaces(el);
        if (!text) return;
        const computedStyle = window.getComputedStyle(el);
        headings.push({ 
            text, 
            fontSize: parseFloat(computedStyle.fontSize) || 0, 
            fontWeight: parseInt(computedStyle.fontWeight) || 400 
        });
    });

    if (headings.length === 0) return "Not detected";
    
    const maxFontSize = Math.max(...headings.map(h => h.fontSize));
    const largestFontHeadings = headings.filter(h => h.fontSize >= maxFontSize * 0.9);
    if (largestFontHeadings.length === 0) return headings[0] ? headings[0].text : "Not detected";

    const maxFontWeight = Math.max(...largestFontHeadings.map(h => h.fontWeight));
    const finalHeadings = largestFontHeadings.filter(h => h.fontWeight === maxFontWeight);
    
    const uniqueTexts = [...new Set(finalHeadings.map(h => h.text))];
    return uniqueTexts.join(' | ');
}


function analyzeContent() {
    console.log("CANVA ANALYZER: Starting analysis function...");
    
    const extractedData = extractAllTextAndFonts();
    const data = {
        docType: getDocumentTypeFromTitle(),
        heading: extractMainHeading(),
        fullText: extractedData.fullText, // Ensure property name matches
        usedFonts: extractedData.usedFonts
    };
    
    console.log("CANVA ANALYZER: Data collected from page:", data);

    if (!data.fullText || data.fullText.trim() === '' || data.fullText === 'No text found on page.') {
        console.error("CANVA ANALYZER: Aborting analysis because no usable text content was found.");
        chrome.runtime.sendMessage({ action: "analysisError", error: "No text found on design." });
        return;
    }

    chrome.runtime.sendMessage({
        action: "sendContentData",
        data: data
    });
    console.log("CANVA ANALYZER: Sent data to background script.");
}

window.triggerManualAnalysis = function() {
    console.log("CANVA ANALYZER: Manual trigger function was called.");
    try {
        analyzeContent();
    } catch (error) {
        if (!error.message?.includes('Extension context invalidated')) {
            console.warn('Manual analysis trigger failed:', error);
        }
    }
};
console.log("CANVA ANALYZER: triggerManualAnalysis function has been defined on the window object.");

setTimeout(() => {
    console.log("CANVA ANALYZER: Triggering initial analysis after 2-second delay.");
    window.triggerManualAnalysis();
}, 2000);