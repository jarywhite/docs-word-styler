// Google Docs Formatting Handler for Canvas and HTML modes
// Handles text selection and formatting in both rendering modes

console.log('🎨 Formatting handler initializing...');

// Global state to track rendering mode
let docsRenderingMode = null;
let kixEditor = null;

// Inject formatting logic into page context to access Google's internal APIs
function injectFormattingScript() {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      console.log('🎨 Page context formatting script loaded');
      
      // Global formatting function accessible from content script
      window.docsFormattingHandler = {
        currentMode: null,
        kixApp: null,
        
        // Initialize and detect mode
        init: function() {
          this.detectMode();
          this.findKixEditor();
        },
        
        // Detect current rendering mode
        detectMode: function() {
          const canvasMode = document.querySelector('#kix-appview .kix-page-paginated.canvas-first-page');
          const htmlMode = document.querySelector('#kix-appview .kix-page:not(.canvas-first-page)');
          
          if (canvasMode) {
            this.currentMode = 'canvas';
            console.log('🎨 Formatting initialized for CANVAS mode');
          } else if (htmlMode) {
            this.currentMode = 'html';
            console.log('🎨 Formatting initialized for HTML mode');
          } else {
            this.currentMode = 'unknown';
            console.log('⚠️ Unknown rendering mode');
          }
          
          return this.currentMode;
        },
        
        // Find Kix editor instance for canvas mode
        findKixEditor: function() {
          try {
            // Google's internal Kix editor is often stored in global variables
            if (window.kix) {
              this.kixApp = window.kix;
              console.log('✅ Found Kix editor instance');
            } else if (window._docs_kix_) {
              this.kixApp = window._docs_kix_;
              console.log('✅ Found _docs_kix_ instance');
            } else {
              console.log('❌ Kix editor instance not found');
              // TODO: Research other ways to access Kix API
            }
          } catch (e) {
            console.log('❌ Error finding Kix editor:', e);
          }
        },
        
        // Get current text selection
        getCurrentSelection: function() {
          if (this.currentMode === 'canvas') {
            return this.getCanvasSelection();
          } else if (this.currentMode === 'html') {
            return this.getHTMLSelection();
          }
          return null;
        },
        
        // Get selection in canvas mode
        getCanvasSelection: function() {
          try {
            const selection = window.getSelection();
            console.log('🎯 Canvas selection:', {
              text: selection.toString(),
              rangeCount: selection.rangeCount,
              anchorNode: selection.anchorNode,
              isCollapsed: selection.isCollapsed
            });
            
            // TODO: Access Kix internal selection API for more control
            // TODO: Use annotated canvas DOM elements for precise positioning
            
            if (selection.rangeCount > 0 && !selection.isCollapsed) {
              return {
                text: selection.toString(),
                range: selection.getRangeAt(0),
                mode: 'canvas'
              };
            }
            
            return null;
          } catch (e) {
            console.log('❌ Error getting canvas selection:', e);
            return null;
          }
        },
        
        // Get selection in HTML mode
        getHTMLSelection: function() {
          try {
            const selection = window.getSelection();
            console.log('🎯 HTML selection:', {
              text: selection.toString(),
              rangeCount: selection.rangeCount
            });
            
            if (selection.rangeCount > 0 && !selection.isCollapsed) {
              return {
                text: selection.toString(),
                range: selection.getRangeAt(0),
                mode: 'html'
              };
            }
            
            return null;
          } catch (e) {
            console.log('❌ Error getting HTML selection:', e);
            return null;
          }
        },
        
        // Apply bold formatting
        applyBold: function() {
          const selection = this.getCurrentSelection();
          if (!selection) {
            console.log('❌ No text selected for bold formatting');
            return false;
          }
          
          console.log(\`🔥 Applying bold to: "\${selection.text.substring(0, 20)}..."\`);
          
          if (this.currentMode === 'canvas') {
            return this.applyCanvasBold(selection);
          } else if (this.currentMode === 'html') {
            return this.applyHTMLBold(selection);
          }
          
          return false;
        },
        
        // Apply bold in canvas mode
        applyCanvasBold: function(selection) {
          try {
            // Method 1: Try to use Kix internal API
            if (this.kixApp && this.kixApp.formatSelection) {
              console.log('🎨 Attempting Kix API bold formatting...');
              // TODO: Research exact Kix API method names
              // this.kixApp.formatSelection('bold', true);
              console.log('📝 TODO: Implement Kix API bold formatting');
              return false;
            }
            
            // Method 2: Try clicking the bold button with selection intact
            console.log('🎨 Attempting button-click bold formatting...');
            const boldButton = document.querySelector('#boldButton');
            if (boldButton && selection.range) {
              // Restore selection before clicking button
              const newSelection = window.getSelection();
              newSelection.removeAllRanges();
              newSelection.addRange(selection.range);
              
              boldButton.click();
              console.log('✅ Canvas bold applied via button click');
              return true;
            }
            
            console.log('📝 TODO: Research other canvas formatting methods');
            return false;
            
          } catch (e) {
            console.log('❌ Error applying canvas bold:', e);
            return false;
          }
        },
        
        // Apply bold in HTML mode
        applyHTMLBold: function(selection) {
          try {
            console.log('🎨 Applying HTML bold via document.execCommand...');
            
            // Restore selection
            const newSelection = window.getSelection();
            newSelection.removeAllRanges();
            newSelection.addRange(selection.range);
            
            // Use traditional DOM method
            const success = document.execCommand('bold', false, null);
            console.log(\`\${success ? '✅' : '❌'} HTML bold applied: \${success}\`);
            
            return success;
            
          } catch (e) {
            console.log('❌ Error applying HTML bold:', e);
            return false;
          }
        }
      };
      
      // Initialize when ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => window.docsFormattingHandler.init(), 1000);
        });
      } else {
        setTimeout(() => window.docsFormattingHandler.init(), 1000);
      }
      
    })();
  `;
  
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  
  console.log('🎨 Formatting script injected into page context');
}

// Content script interface for formatting
function applyBoldFormatting() {
  console.log('🔥 Bold formatting requested from content script...');
  
  // Execute in page context where we have access to Google's APIs
  const script = document.createElement('script');
  script.textContent = `
    if (window.docsFormattingHandler) {
      const result = window.docsFormattingHandler.applyBold();
      console.log('🔥 Bold formatting result:', result);
    } else {
      console.log('❌ Formatting handler not available');
    }
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🎨 Formatting message received:', message);
  
  if (message.action === 'applyBold') {
    applyBoldFormatting();
    sendResponse({ success: true });
  } else if (message.action === 'testFormatting') {
    // Test command for manual testing
    applyBoldFormatting();
    sendResponse({ success: true });
  }
});

// Initialize formatting when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectFormattingScript, 2000); // Wait for Google Docs to load
  });
} else {
  setTimeout(injectFormattingScript, 2000);
}

console.log('🎨 Formatting handler setup complete');