console.log('Docs Word Styler content script loaded');

// Direct access to Google Docs without inline script injection
function setupDocsAPI() {
  // Create API object directly in content script context
  window.docsAPI = {
    findText: function(phrase) {
      try {
        const textbox = document.querySelector('[role="textbox"]');
        if (textbox) {
          console.log('Found Google Docs textbox element');
          return true;
        }
        return false;
      } catch (e) {
        console.log('Could not access textbox:', e);
        return false;
      }
    },
    
    getDocumentText: function() {
      try {
        // Try multiple methods to get document text
        const textbox = document.querySelector('[role="textbox"]');
        if (textbox) {
          return textbox.innerText || textbox.textContent;
        }
        
        // Try canvas content extraction
        const canvasElements = document.querySelectorAll('canvas');
        console.log(`Found ${canvasElements.length} canvas elements`);
        
        // Fallback to body text
        return document.body.innerText;
      } catch (e) {
        console.log('Error getting document text:', e);
        return '';
      }
    },
    
    findTextInDocument: function(phrase) {
      try {
        // Simple approach: search all elements for text content
        const allElements = document.querySelectorAll('*');
        const matches = [];
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i];
          // Check if element has text content and no child elements (leaf nodes)
          if (element.textContent && 
              element.children.length === 0 && 
              element.textContent.toLowerCase().includes(phrase.toLowerCase())) {
            matches.push(element);
          }
        }
        
        console.log(`Found ${matches.length} elements containing "${phrase}"`);
        return matches;
      } catch (e) {
        console.log('Error in findTextInDocument:', e);
        return [];
      }
    }
  };
  
  console.log('Google Docs API setup complete');
}

// Google Docs-specific selection handling
function tryGoogleDocsSelection(phrase, styles) {
  console.log('=== TRYING GOOGLE DOCS SELECTION METHODS ===');
  
  // Method 1: Check for highlighted/selected elements
  const highlightedElements = document.querySelectorAll('[style*="background"], .selected, [aria-selected="true"]');
  console.log(`Found ${highlightedElements.length} potentially highlighted elements`);
  
  for (let element of highlightedElements) {
    const text = element.textContent || element.innerText;
    console.log(`Checking highlighted element text: "${text}"`);
    if (text && text.toLowerCase().includes(phrase.toLowerCase())) {
      console.log(`✅ FOUND in highlighted element: "${text}"`);
      showNotification(`Found "${phrase}" in highlighted text. Applying keyboard shortcuts...`);
      return applyKeyboardFormatting(styles);
    }
  }
  
  // Method 2: Check focused/active elements
  const activeElement = document.activeElement;
  if (activeElement) {
    console.log('Active element:', activeElement);
    const activeText = activeElement.textContent || activeElement.innerText || '';
    console.log(`Active element text: "${activeText}"`);
    if (activeText.toLowerCase().includes(phrase.toLowerCase())) {
      console.log(`✅ FOUND in active element`);
      showNotification(`Found "${phrase}" in active element. Applying keyboard shortcuts...`);
      return applyKeyboardFormatting(styles);
    }
  }
  
  // Method 3: Check Google Docs cursor/selection state
  const cursorElements = document.querySelectorAll('[class*="cursor"], [class*="selection"], [class*="highlight"]');
  console.log(`Found ${cursorElements.length} cursor/selection elements`);
  
  // Method 4: Try manual confirmation approach
  console.log('Using manual confirmation approach');
  showNotification(`Click OK if "${phrase}" is currently selected, then try again.`, true);
  
  // Method 5: Apply formatting assuming text is selected (Google Docs specific)
  console.log('Attempting direct keyboard formatting on assumed selection');
  return applyKeyboardFormatting(styles);
}

// Apply formatting using keyboard shortcuts (works with Google Docs selection)
function applyKeyboardFormatting(styles) {
  console.log('Applying keyboard formatting shortcuts');
  
  try {
    let applied = [];
    
    // Try multiple Google Docs targeting strategies
    const targets = [
      document.querySelector('.kix-appview-editor'),
      document.querySelector('[role="textbox"]'),
      document.querySelector('.docs-texteventtarget-iframe'),
      document.activeElement,
      document.body
    ].filter(el => el);
    
    console.log(`Found ${targets.length} potential targets for keyboard events`);
    
    // Focus sequence for Google Docs
    targets.forEach((target, index) => {
      console.log(`Focusing target ${index}:`, target);
      try {
        target.focus();
        target.click && target.click();
      } catch (e) {
        console.log(`Focus failed for target ${index}:`, e);
      }
    });
    
    // Wait for focus to settle, then apply formatting with timing
    setTimeout(() => {
      console.log('Applying keyboard shortcuts after focus delay...');
      
      if (styles.bold) {
        targets.forEach(target => simulateKeyPressOnTarget(target, 'KeyB', true));
        applied.push('bold');
        console.log('Applied Ctrl+B for bold on all targets');
      }
      
      if (styles.italic) {
        setTimeout(() => {
          targets.forEach(target => simulateKeyPressOnTarget(target, 'KeyI', true));
          applied.push('italic');
          console.log('Applied Ctrl+I for italic on all targets');
        }, 100);
      }
      
      if (styles.underline) {
        setTimeout(() => {
          targets.forEach(target => simulateKeyPressOnTarget(target, 'KeyU', true));
          applied.push('underline');
          console.log('Applied Ctrl+U for underline on all targets');
        }, 200);
      }
      
      if (applied.length > 0) {
        showNotification(`Sent ${applied.join(', ')} keyboard shortcuts to Google Docs!`);
      }
      
    }, 300); // Wait for Google Docs to settle
    
    return true;
    
  } catch (error) {
    console.error('Error in keyboard formatting:', error);
    return false;
  }
}

// Simulate keyboard press events on specific target
function simulateKeyPressOnTarget(target, code, ctrlKey = false) {
  if (!target) return;
  
  const events = ['keydown', 'keypress', 'keyup'];
  const key = code.replace('Key', '').toLowerCase();
  
  events.forEach(eventType => {
    const keyEvent = new KeyboardEvent(eventType, {
      code: code,
      key: key,
      ctrlKey: ctrlKey,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    
    try {
      target.dispatchEvent(keyEvent);
      console.log(`Sent ${eventType} ${key} to:`, target.tagName || target.constructor.name);
    } catch (e) {
      console.log(`Failed to send ${eventType} to target:`, e);
    }
  });
}

// Simulate keyboard press events (legacy function)
function simulateKeyPress(code, ctrlKey = false) {
  const keyEvent = new KeyboardEvent('keydown', {
    code: code,
    key: code.replace('Key', '').toLowerCase(),
    ctrlKey: ctrlKey,
    bubbles: true,
    cancelable: true
  });
  
  document.dispatchEvent(keyEvent);
  
  // Also try on the active element
  if (document.activeElement) {
    document.activeElement.dispatchEvent(keyEvent);
  }
}

// Enhanced text finding using multiple approaches
function findAndStyleTextAdvanced(phrase, styles) {
  console.log(`Advanced search for phrase: ${phrase}`, styles);
  
  // Try to find text in document using TreeWalker
  const matches = window.docsAPI.findTextInDocument(phrase);
  
  if (matches.length > 0) {
    console.log(`Found ${matches.length} matches for "${phrase}"`);
    showNotification(`Found "${phrase}" in ${matches.length} locations. Please select the text manually to apply formatting.`);
    return true;
  }
  
  return false;
}

// Enhanced text finding and formatting
function findAndStyleText(phrase, styles) {
  console.log(`Styling phrase: ${phrase}`, styles);
  
  // Method 1: Check stored selection (captured before popup opened)
  console.log('=== STORED SELECTION CHECK ===');
  console.log('Stored selection:', storedSelection);
  
  const timeSinceSelection = Date.now() - storedSelection.timestamp;
  console.log(`Time since selection: ${timeSinceSelection}ms`);
  
  if (storedSelection.text && timeSinceSelection < 30000) { // 30 second timeout
    const storedText = storedSelection.text.trim();
    console.log(`Checking stored selection: "${storedText}"`);
    
    if (storedText.toLowerCase().includes(phrase.toLowerCase()) ||
        phrase.toLowerCase().includes(storedText.toLowerCase())) {
      console.log(`✅ MATCH FOUND in stored selection! "${phrase}" matches with: "${storedText}"`);
      
      // Try to restore the selection using the stored range
      if (storedSelection.range) {
        try {
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(storedSelection.range);
          console.log('Restored selection range');
          
          // Apply formatting immediately
          return applyFormattingToSelection(storedText, styles);
        } catch (e) {
          console.log('Could not restore range, using keyboard shortcuts:', e);
          return applyKeyboardFormatting(styles);
        }
      } else {
        console.log('No stored range, using keyboard shortcuts');
        return applyKeyboardFormatting(styles);
      }
    }
  }
  
  // Method 2: Check current selection (will likely be empty due to focus loss)
  console.log('=== CURRENT SELECTION CHECK ===');
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  console.log(`Current selection: "${selectedText}"`);
  console.log(`Selection type: ${selection.type}`);
  console.log(`Range count: ${selection.rangeCount}`);
  
  if (selectedText && (
    selectedText.toLowerCase().includes(phrase.toLowerCase()) ||
    phrase.toLowerCase().includes(selectedText.toLowerCase())
  )) {
    console.log(`✅ MATCH FOUND in current selection! "${phrase}" matches with: "${selectedText}"`);
    return applyFormattingToSelection(selectedText, styles);
  }
  
  // Method 3: Try Google Docs-specific selection methods
  console.log(`❌ NO SELECTION MATCH. Trying Google Docs methods...`);
  return tryGoogleDocsSelection(phrase, styles);
}

function applyFormattingToSelection(selectedText, styles) {
  try {
    let applied = [];
    
    if (styles.bold) {
      document.execCommand('bold', false, null);
      applied.push('bold');
      console.log('Applied bold to selection');
    }
    if (styles.italic) {
      document.execCommand('italic', false, null);
      applied.push('italic');
      console.log('Applied italic to selection');
    }
    if (styles.underline) {
      document.execCommand('underline', false, null);
      applied.push('underline');
      console.log('Applied underline to selection');
    }
    
    showNotification(`Applied ${applied.join(', ')} to "${selectedText}"!`);
    return true;
    
  } catch (error) {
    console.error('Error applying styles:', error);
    showNotification('Error applying styles. Please try again.');
    return false;
  }
}

function setupMutationObserver(phrase, styles) {
  // Watch for changes in the document that might indicate new text
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        // Check if the phrase appears in any new text
        const target = mutation.target;
        if (target.textContent && target.textContent.includes(phrase)) {
          console.log('Found phrase in mutation:', phrase);
          // Don't auto-apply, just notify user
          showNotification(`"${phrase}" detected in document. Select it to apply formatting.`);
        }
      }
    });
  });
  
  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  // Stop observing after 30 seconds to avoid memory leaks
  setTimeout(() => observer.disconnect(), 30000);
}

function simulateFind(phrase, styles) {
  // Try the browser's native find functionality
  try {
    if (window.find && window.find(phrase, false, false, true, false, true, false)) {
      console.log('Found phrase using window.find');
      
      // Wait a moment for selection to settle, then apply formatting
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.toString().toLowerCase().includes(phrase.toLowerCase())) {
          applyFormattingToSelection(selection.toString(), styles);
        }
      }, 100);
      
      return true;
    }
  } catch (e) {
    console.log('window.find not available or failed:', e);
  }
  
  // Fallback message
  showNotification(`Please select "${phrase}" manually, then try again.`);
  return false;
}

function showNotification(message) {
  // Create a temporary notification div
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4285f4;
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    font-family: 'Google Sans', Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Store selection data when user makes a selection
let storedSelection = {
  text: '',
  timestamp: 0,
  range: null
};

// Capture selection whenever user selects text
document.addEventListener('mouseup', () => {
  captureCurrentSelection();
});

document.addEventListener('keyup', () => {
  captureCurrentSelection();
});

function captureCurrentSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText) {
    storedSelection = {
      text: selectedText,
      timestamp: Date.now(),
      range: selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null
    };
    console.log(`📝 STORED SELECTION: "${selectedText}"`);
  }
}

// Initialize the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDocsAPI);
} else {
  setupDocsAPI();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'styleText') {
    const { phrase, styles } = message;
    findAndStyleText(phrase, styles);
    sendResponse({ success: true });
  } else if (message.action === 'applyFormatting') {
    // SIMPLE: Just apply formatting immediately
    console.log('SIMPLE FORMATTING:', message.styles);
    
    // Focus on Google Docs
    const editor = document.querySelector('.kix-appview-editor');
    if (editor) {
      editor.focus();
      editor.click();
    }
    
    // Wait then send keyboard shortcuts
    setTimeout(() => {
      if (message.styles.bold) {
        document.execCommand('bold', false, null);
        console.log('Sent bold command');
      }
      if (message.styles.italic) {
        document.execCommand('italic', false, null);
        console.log('Sent italic command');
      }
      if (message.styles.underline) {
        document.execCommand('underline', false, null);
        console.log('Sent underline command');
      }
    }, 100);
    
    sendResponse({ success: true });
  }
});