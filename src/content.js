console.log('Docs Word Styler v2.0 - Using Proven Google Docs Integration');

// Selection preservation state
let storedSelection = {
  text: '',
  timestamp: 0,
  range: null,
  anchorNode: null,
  anchorOffset: 0,
  focusNode: null,
  focusOffset: 0
};

// Initialize the extension
function initialize() {
  console.log('Initializing Docs Word Styler...');
  
  // Set up selection capture listeners
  document.addEventListener('mouseup', captureSelection);
  document.addEventListener('keyup', captureSelection);
  
  // Store initial selection state if any
  captureSelection();
  
  console.log('Extension initialized successfully');
}

// Capture current selection using multiple methods
function captureSelection() {
  try {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      storedSelection = {
        text: selectedText,
        timestamp: Date.now(),
        range: selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null,
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset
      };
      
      // Store in session storage for persistence across popup interactions
      chrome.storage.session.set({
        docsWordStylerSelection: storedSelection
      });
      
      console.log('📝 Selection captured:', selectedText);
    }
  } catch (error) {
    console.log('Selection capture error:', error);
  }
}

// Get Google Docs iframe window
function getDocsIframe() {
  const iframe = document.querySelector('iframe.docs-texteventtarget-iframe');
  if (iframe && iframe.contentWindow) {
    return iframe.contentWindow;
  }
  
  // Fallback: look for any iframe that might contain the editor
  const iframes = document.querySelectorAll('iframe');
  for (let frame of iframes) {
    try {
      if (frame.contentWindow && frame.contentWindow.document) {
        const hasEditor = frame.contentWindow.document.querySelector('[role="textbox"]') ||
                         frame.contentWindow.document.querySelector('.kix-appview-editor');
        if (hasEditor) {
          return frame.contentWindow;
        }
      }
    } catch (e) {
      // Cross-origin iframe, skip
      continue;
    }
  }
  
  return window; // Fallback to main window
}

// Focus the Google Docs iframe properly
function focusDocsIframe(win) {
  try {
    // Focus the iframe window
    win.focus();
    
    // Focus the editor elements within the iframe
    const targets = [
      win.document.querySelector('[role="textbox"]'),
      win.document.querySelector('.kix-appview-editor'),
      win.document.activeElement,
      win.document.body
    ].filter(el => el);
    
    targets.forEach(target => {
      try {
        target.focus();
        if (target.click) target.click();
      } catch (e) {
        console.log('Focus attempt failed:', e);
      }
    });
    
    return true;
  } catch (error) {
    console.log('Focus error:', error);
    return false;
  }
}

// Restore selection in the iframe
function restoreSelection(win) {
  try {
    // Get selection from session storage first
    chrome.storage.session.get(['docsWordStylerSelection'], (result) => {
      const savedSelection = result.docsWordStylerSelection || storedSelection;
      
      if (savedSelection && savedSelection.text && Date.now() - savedSelection.timestamp < 30000) {
        console.log('Attempting to restore selection:', savedSelection.text);
        
        // Try to restore the exact range if available
        if (savedSelection.range) {
          try {
            const selection = win.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection.range);
            console.log('✅ Selection range restored');
            return;
          } catch (e) {
            console.log('Range restoration failed, trying alternative methods');
          }
        }
        
        // Try to restore using stored selection coordinates
        if (savedSelection.anchorNode && savedSelection.focusNode) {
          try {
            const selection = win.getSelection();
            selection.setBaseAndExtent(
              savedSelection.anchorNode,
              savedSelection.anchorOffset,
              savedSelection.focusNode,
              savedSelection.focusOffset
            );
            console.log('✅ Selection coordinates restored');
            return;
          } catch (e) {
            console.log('Coordinate restoration failed');
          }
        }
      }
    });
  } catch (error) {
    console.log('Selection restoration error:', error);
  }
}

// Send synthetic keyboard events to Google Docs iframe
function sendSyntheticKeyEvent(win, key, code, ctrlKey = false) {
  const events = ['keydown', 'keyup'];
  
  events.forEach(eventType => {
    const keyEvent = new KeyboardEvent(eventType, {
      key: key,
      code: code,
      ctrlKey: ctrlKey,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    
    try {
      // Send to the iframe document
      win.document.dispatchEvent(keyEvent);
      
      // Also send to focused element within iframe
      if (win.document.activeElement) {
        win.document.activeElement.dispatchEvent(keyEvent);
      }
      
      console.log(`Sent ${eventType} ${key} to Google Docs iframe`);
    } catch (error) {
      console.log(`Failed to send ${eventType}:`, error);
    }
  });
}

// Apply formatting using the proven Google Docs method
function applyFormatting(styles) {
  console.log('🎯 Applying formatting with proven method:', styles);
  
  // Get the Google Docs iframe
  const win = getDocsIframe();
  
  // Focus the iframe first
  console.log('Focusing Google Docs iframe...');
  const focused = focusDocsIframe(win);
  
  if (!focused) {
    showNotification('Could not focus Google Docs. Please ensure you are on a Google Docs page.');
    return false;
  }
  
  // Wait for focus to settle, then restore selection
  setTimeout(() => {
    console.log('Restoring selection...');
    restoreSelection(win);
    
    // Wait a bit more for selection to settle, then apply formatting
    setTimeout(() => {
      console.log('Sending formatting commands...');
      
      let applied = [];
      
      if (styles.bold) {
        sendSyntheticKeyEvent(win, 'b', 'KeyB', true);
        applied.push('bold');
      }
      
      if (styles.italic) {
        setTimeout(() => {
          sendSyntheticKeyEvent(win, 'i', 'KeyI', true);
          applied.push('italic');
        }, 100);
      }
      
      if (styles.underline) {
        setTimeout(() => {
          sendSyntheticKeyEvent(win, 'u', 'KeyU', true);
          applied.push('underline');
        }, 200);
      }
      
      if (applied.length > 0) {
        showNotification(`✅ Applied ${applied.join(', ')} formatting to Google Docs!`);
      }
      
    }, 100); // Wait for selection restoration
    
  }, 50); // Wait for focus to settle
  
  return true;
}

// Enhanced notification system
function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${isError ? '#ea4335' : '#34a853'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'Google Sans', Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transition = 'opacity 0.3s ease-out';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 4000);
}

// Message handler for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === 'applyFormatting') {
    const success = applyFormatting(message.styles);
    sendResponse({ success });
  } else if (message.action === 'styleText') {
    // Legacy support - redirect to new method
    const success = applyFormatting(message.styles);
    sendResponse({ success });
  } else if (message.action === 'captureSelection') {
    captureSelection();
    sendResponse({ success: true, selection: storedSelection });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('Docs Word Styler content script loaded successfully');