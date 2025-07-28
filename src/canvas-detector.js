// Canvas Detection Proof-of-Concept for Google Docs
// This script detects whether Google Docs is using Canvas or HTML rendering
// and provides foundation for canvas-aware formatting

console.log('🔍 Canvas Detection PoC Starting...');

// Inject script into page context to access window._docs variables
function injectPageScript() {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      console.log('📄 Page context script injected');
      
      // Force annotated canvas mode for better DOM access
      // This allows extensions to get DOM elements within canvas for positioning
      window._docs_annotate_canvas_by_ext = 'docs-word-styler-' + Date.now();
      
      // Detect Google Docs rendering mode
      function detectGoogleDocsMode() {
        console.log('🔍 Detecting Google Docs rendering mode...');
        
        // Canvas mode indicators
        const canvasMode = document.querySelector('#kix-appview .kix-page-paginated.canvas-first-page');
        const canvasContainer = document.querySelector('#kix-appview .kix-appview-editor-container');
        const rotatingTileManager = document.querySelector('.kix-rotatingtilemanager');
        
        // HTML mode indicators  
        const htmlMode = document.querySelector('#kix-appview .kix-page:not(.canvas-first-page)');
        const htmlContainer = document.querySelector('.kix-zoomdocumentplugin-outer');
        
        if (canvasMode || rotatingTileManager) {
          console.log('✅ CANVAS MODE DETECTED');
          console.log('📍 Canvas element:', canvasMode);
          console.log('📍 Canvas container:', canvasContainer);
          console.log('📍 Tile manager:', rotatingTileManager);
          
          // TODO: Implement canvas-specific text selection and formatting
          // TODO: Use annotated canvas DOM elements for text positioning
          // TODO: Hook into Google's Kix text manipulation APIs
          
          return 'canvas';
          
        } else if (htmlMode || htmlContainer) {
          console.log('✅ HTML MODE DETECTED');
          console.log('📍 HTML element:', htmlMode);
          console.log('📍 HTML container:', htmlContainer);
          
          // TODO: Implement traditional DOM text selection and formatting
          // TODO: Use standard CSS styling approaches
          
          return 'html';
          
        } else {
          console.log('❌ No Google Docs editor found - checking again...');
          
          // Log all kix-related elements for debugging
          const allKixElements = document.querySelectorAll('[class*="kix"]');
          console.log('🔍 Found kix elements:', allKixElements.length);
          allKixElements.forEach((el, i) => {
            if (i < 5) console.log(\`  - \${el.className}\`);
          });
          
          return null;
        }
      }
      
      // Wait for Google Docs to load completely
      let attempts = 0;
      const maxAttempts = 10;
      
      function tryDetection() {
        attempts++;
        const mode = detectGoogleDocsMode();
        
        if (!mode && attempts < maxAttempts) {
          console.log(\`🔄 Attempt \${attempts}/\${maxAttempts} - retrying in 1s...\`);
          setTimeout(tryDetection, 1000);
        } else if (mode) {
          console.log(\`🎉 Detection successful on attempt \${attempts}: \${mode.toUpperCase()} mode\`);
        } else {
          console.log('⚠️ Max detection attempts reached - Google Docs may not be loaded');
        }
      }
      
      // Start detection process
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryDetection);
      } else {
        tryDetection();
      }
    })();
  `;
  
  // Inject at document head to run as early as possible
  (document.head || document.documentElement).appendChild(script);
  script.remove(); // Clean up script element
  
  console.log('📤 Page context script injected successfully');
}

// Run injection immediately - this must happen at document_start
// to catch Google's initialization before canvas mode is set
injectPageScript();

console.log('🔍 Canvas Detection PoC Setup Complete');