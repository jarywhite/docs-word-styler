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
      
      // Storage handled locally to avoid access issues
      
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
    // Use local storage instead of chrome.storage.session
    const savedSelection = storedSelection;
    
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
    
    console.log('No valid selection to restore, proceeding with formatting');
  } catch (error) {
    console.log('Selection restoration error:', error);
  }
}

// Send synthetic keyboard events using the exact method successful extensions use
function sendSyntheticKeyEvent(win, key, code, ctrlKey = false) {
  try {
    // Get the primary textbox target
    const textbox = win.document.querySelector('[role="textbox"]');
    const editor = win.document.querySelector('.kix-appview-editor');
    const activeElement = win.document.activeElement;
    
    // Use the most specific target first
    const primaryTarget = textbox || editor || activeElement || win.document.body;
    
    // Create the exact key event sequence that Google Docs recognizes
    const eventSequence = [
      {
        type: 'keydown',
        options: {
          key: key,
          code: code,
          keyCode: key.charCodeAt(0) - 32, // Convert to keyCode
          which: key.charCodeAt(0) - 32,
          ctrlKey: ctrlKey,
          metaKey: ctrlKey && navigator.platform.includes('Mac'),
          bubbles: true,
          cancelable: true,
          composed: true,
          isTrusted: true
        }
      },
      {
        type: 'keypress', 
        options: {
          key: key,
          code: code,
          keyCode: key.charCodeAt(0) - 32,
          which: key.charCodeAt(0) - 32,
          ctrlKey: ctrlKey,
          metaKey: ctrlKey && navigator.platform.includes('Mac'),
          bubbles: true,
          cancelable: true,
          composed: true,
          isTrusted: true
        }
      },
      {
        type: 'keyup',
        options: {
          key: key,
          code: code,
          keyCode: key.charCodeAt(0) - 32,
          which: key.charCodeAt(0) - 32,
          ctrlKey: ctrlKey,
          metaKey: ctrlKey && navigator.platform.includes('Mac'),
          bubbles: true,
          cancelable: true,
          composed: true,
          isTrusted: true
        }
      }
    ];
    
    // Send the complete sequence to the primary target
    eventSequence.forEach((eventConfig, index) => {
      setTimeout(() => {
        try {
          const event = new KeyboardEvent(eventConfig.type, eventConfig.options);
          
          // Try to make the event appear more "trusted" 
          Object.defineProperty(event, 'isTrusted', { value: true });
          
          primaryTarget.dispatchEvent(event);
          console.log(`✅ Sent ${eventConfig.type} ${key} (keyCode: ${eventConfig.options.keyCode}) to Google Docs`);
          
          // Also send to document for backup
          win.document.dispatchEvent(event);
          
        } catch (e) {
          console.log(`Failed to send ${eventConfig.type}:`, e);
        }
      }, index * 10); // 10ms delay between events
    });
    
  } catch (error) {
    console.log('Keyboard event error:', error);
  }
}

// Alternative approach: Try direct command execution
function tryDirectCommands(win, styles) {
  try {
    const textbox = win.document.querySelector('[role="textbox"]');
    if (textbox) {
      // Try the execCommand approach on the iframe
      if (styles.bold) {
        win.document.execCommand('bold');
        console.log('Tried execCommand bold on iframe');
      }
      if (styles.italic) {
        win.document.execCommand('italic');
        console.log('Tried execCommand italic on iframe');
      }
      if (styles.underline) {
        win.document.execCommand('underline');
        console.log('Tried execCommand underline on iframe');
      }
    }
  } catch (e) {
    console.log('Direct commands failed:', e);
  }
}

// Apply formatting using multiple proven methods
function applyFormatting(styles) {
  console.log('🎯 Applying formatting with multiple proven methods:', styles);
  
  // Get the Google Docs iframe
  const win = getDocsIframe();
  
  // Focus the iframe first
  console.log('Focusing Google Docs iframe...');
  const focused = focusDocsIframe(win);
  
  if (!focused) {
    showNotification('Could not focus Google Docs. Please ensure you are on a Google Docs page.');
    return false;
  }
  
  // Multiple approaches in sequence
  setTimeout(() => {
    console.log('Applying formatting to current selection...');
    
    let applied = [];
    
    // Method 1: Synthetic keyboard events with proper sequence
    if (styles.bold) {
      sendSyntheticKeyEvent(win, 'b', 'KeyB', true);
      applied.push('bold');
    }
    
    if (styles.italic) {
      setTimeout(() => sendSyntheticKeyEvent(win, 'i', 'KeyI', true), 50);
      applied.push('italic');
    }
    
    if (styles.underline) {
      setTimeout(() => sendSyntheticKeyEvent(win, 'u', 'KeyU', true), 100);
      applied.push('underline');
    }
    
    // Method 2: Try direct commands as fallback
    setTimeout(() => {
      tryDirectCommands(win, styles);
    }, 200);
    
    if (applied.length > 0) {
      showNotification(`🚀 Sending ${applied.join(', ')} commands to Google Docs! Check your text.`);
    } else {
      showNotification('Select text in Google Docs first, then use the extension.', true);
    }
    
  }, 300); // Longer delay for proper focus settling
  
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