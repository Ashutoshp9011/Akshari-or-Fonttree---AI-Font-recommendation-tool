// --- File: floating-popup.js (Corrected) ---

class CanvaAnalyzerFloatingPopup {
    constructor() {
        this.popup = null;
        this.init();
        console.log("CANVA ANALYZER: floating-popup.js constructor finished.");
    }

    init() {
        this.createPopup();
        this.setupEventListeners();
        this.setupMessageListener();
        setTimeout(() => this.showPopup(), 500);
    }

    createPopup() {
        this.popup = document.createElement('div');
        this.popup.className = 'canva-analyzer-floating-popup';
        this.popup.innerHTML = `
            <div class="canva-analyzer-popup-header">
                <h3 class="canva-analyzer-popup-title">🎨 Font Analyzer</h3>
                <div class="canva-analyzer-popup-controls">
                    <button class="canva-analyzer-popup-btn" id="canva-analyzer-refresh" title="Refresh Analysis">↻</button>
                    <button class="canva-analyzer-popup-btn" id="canva-analyzer-close" title="Close">×</button>
                </div>
            </div>
            <div class="canva-analyzer-popup-content"><!-- ... content ... --></div>
            <div class="canva-analyzer-status" id="canva-analyzer-status">Initializing...</div>
        `;
        // The rest of the innerHTML is the same as before
        const content = this.popup.querySelector('.canva-analyzer-popup-content');
        content.innerHTML = `
            <div class="canva-analyzer-context-grid">
                <div class="canva-analyzer-context-item">
                    <div class="canva-analyzer-info-label">Doc Type</div>
                    <div class="canva-analyzer-info-value" id="canva-analyzer-type">...</div>
                </div>
                <div class="canva-analyzer-context-item">
                    <div class="canva-analyzer-info-label">Purpose</div>
                    <div class="canva-analyzer-info-value" id="canva-analyzer-purpose">...</div>
                </div>
                <div class="canva-analyzer-context-item" style="grid-column: span 2;">
                    <div class="canva-analyzer-info-label">Detected Mood</div>
                    <div class="canva-analyzer-info-value" id="canva-analyzer-mood">...</div>
                </div>
            </div>
            <div class="canva-analyzer-font-list-title">Current Fonts</div>
            <div id="canva-analyzer-font-list"></div>
        `;
        document.body.appendChild(this.popup);
    }

    setupEventListeners() {
        const refreshBtn = this.popup.querySelector('#canva-analyzer-refresh');
        const closeBtn = this.popup.querySelector('#canva-analyzer-close');

        refreshBtn.addEventListener('click', () => {
            console.log("CANVA ANALYZER: Refresh button clicked.");
            this.setStatus('loading', 'Re-analyzing design with AI...');
            
            // Check if the function exists before calling it
            if (typeof window.triggerManualAnalysis === 'function') {
                console.log("CANVA ANALYZER: Found triggerManualAnalysis function. Calling it now.");
                window.triggerManualAnalysis();
            } else {
                console.error("CANVA ANALYZER ERROR: Could not find window.triggerManualAnalysis function!");
                this.setStatus('error', 'Analysis function not found.');
            }
        });

        closeBtn.addEventListener('click', () => this.hidePopup());
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            if (msg.action === "updateAnalyzedData") {
                console.log("CANVA ANALYZER: Received final data from background script.", msg.data);
                this.updateContent(msg.data);
                this.setStatus('active', 'Analysis complete.');
            } else if (msg.action === "sendContentData") {
                this.setStatus('loading', 'Analyzing design with AI...');
            } else if (msg.action === "analysisError") {
                console.error("CANVA ANALYZER: Received error from background script.", msg.error);
                this.setStatus('error', `Error: ${msg.error}`);
            }
        });
    }

    updateContent(data) {
        // This function is the same as before
        if (!this.popup) return;
        this.popup.querySelector('#canva-analyzer-type').textContent = data.docType || 'N/A';
        this.popup.querySelector('#canva-analyzer-purpose').textContent = data.purpose || 'Detecting...';
        this.popup.querySelector('#canva-analyzer-mood').textContent = data.mood || 'Detecting...';
        const fontListContainer = this.popup.querySelector('#canva-analyzer-font-list');
        fontListContainer.innerHTML = '';
        if (data.fontEvaluations && data.fontEvaluations.length > 0) {
            data.fontEvaluations.forEach(font => {
                const isNotIdeal = font.evaluation === 'Not Ideal';
                const evaluationClass = isNotIdeal ? 'not-ideal' : 'good';
                const recommendationHTML = isNotIdeal ? `<div class="font-item-recommendation"><strong>Suggestion: ${font.recommendation}</strong><br><span>${font.reason}</span></div>` : '';
                const fontItem = document.createElement('div');
                fontItem.className = 'canva-analyzer-font-item';
                fontItem.innerHTML = `<div class="font-item-main"><span class="font-item-name">${font.fontName}</span><span class="font-item-evaluation ${evaluationClass}">${font.evaluation}</span></div>${recommendationHTML}`;
                fontListContainer.appendChild(fontItem);
            });
        } else {
            fontListContainer.innerHTML = '<div style="font-size:13px; color:#666; text-align:center; padding:20px 0;">No text fonts detected.</div>';
        }
    }
    
    setStatus(state, message) {
        // This function is the same as before
        const statusEl = this.popup.querySelector('#canva-analyzer-status');
        if(statusEl) {
            statusEl.className = `canva-analyzer-status ${state}`;
            statusEl.textContent = message;
        }
    }

    showPopup() { this.popup?.classList.add('visible'); }
    hidePopup() { this.popup?.remove(); window.canvaAnalyzerPopupInstance = null; }
}

// --- Main Initialization ---
if (!window.canvaAnalyzerPopupInstance) {
    console.log("CANVA ANALYZER: Initializing floating popup instance.");
    window.canvaAnalyzerPopupInstance = new CanvaAnalyzerFloatingPopup();
}