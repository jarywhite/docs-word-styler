console.log('Docs Word Styler v3.0 - Find & Format All Instances');

// Main function to find and format all instances of a word
function findAndFormatAllInstances(phrase, styles) {
  console.log(`🔍 Searching for ALL instances of "${phrase}" to apply:`, styles);
  
  const win = getDocsIframe();
  if (!win) {
    showNotification('Could not access Google Docs. Please ensure you are on a Google Docs page.', true);
    return false;
  }

  // Focus the Google Docs iframe
  focusDocsIframe(win);
  
  // Use Google Docs' native Find & Replace functionality
  setTimeout(() => {
    openFindReplaceAndFormat(win, phrase, styles);
  }, 300);
  
  return true;
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
      continue;
    }
  }
  
  return window;
}

// Focus the Google Docs iframe properly
function focusDocsIframe(win) {
  try {
    win.focus();
    
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

// Open Find & Replace and apply formatting to all instances
function openFindReplaceAndFormat(win, phrase, styles) {
  console.log(`📝 Using Find & Replace approach for "${phrase}"`);
  
  // Step 1: Open Find & Replace with Ctrl+H
  sendKeySequence(win, 'h', 'KeyH', true);
  
  setTimeout(() => {
    // Step 2: Enter the search phrase
    typeText(win, phrase);
    
    setTimeout(() => {
      // Step 3: Tab to "Replace with" field and enter the same phrase
      sendKeySequence(win, 'Tab', 'Tab', false);
      
      setTimeout(() => {
        typeText(win, phrase);
        
        setTimeout(() => {
          // Step 4: Apply formatting to the replacement text
          selectAllInField(win);
          
          setTimeout(() => {
            // Apply the requested formatting
            if (styles.bold) {
              sendKeySequence(win, 'b', 'KeyB', true);
              console.log('Applied bold formatting to replacement');
            }
            
            if (styles.italic) {
              setTimeout(() => {
                sendKeySequence(win, 'i', 'KeyI', true);
                console.log('Applied italic formatting to replacement');
              }, 100);
            }
            
            if (styles.underline) {
              setTimeout(() => {
                sendKeySequence(win, 'u', 'KeyU', true);
                console.log('Applied underline formatting to replacement');
              }, 200);
            }
            
            // Step 5: Replace all instances
            setTimeout(() => {
              replaceAll(win);
              
              setTimeout(() => {
                closeFindReplace(win);
                showNotification(`✅ Applied formatting to all instances of "${phrase}"!`);
              }, 500);
              
            }, 400);
            
          }, 200);
          
        }, 300);
        
      }, 300);
      
    }, 300);
    
  }, 500);
}

// Send keyboard event sequence
function sendKeySequence(win, key, code, ctrlKey = false) {
  const events = ['keydown', 'keyup'];
  
  events.forEach((eventType, index) => {
    setTimeout(() => {
      const keyEvent = new KeyboardEvent(eventType, {
        key: key,
        code: code,
        ctrlKey: ctrlKey,
        metaKey: ctrlKey && navigator.platform.includes('Mac'),
        bubbles: true,
        cancelable: true,
        composed: true
      });
      
      try {
        const targets = [
          win.document.querySelector('[role="textbox"]'),
          win.document.activeElement,
          win.document
        ].filter(el => el);
        
        targets.forEach(target => {
          target.dispatchEvent(keyEvent);
        });
        
        console.log(`Sent ${eventType} ${key} to Google Docs`);
      } catch (e) {
        console.log(`Failed to send ${eventType}:`, e);
      }
    }, index * 10);
  });
}

// Type text into the active field
function typeText(win, text) {
  console.log(`Typing: "${text}"`);
  
  const inputEvent = new InputEvent('input', {
    data: text,
    inputType: 'insertText',
    bubbles: true,
    cancelable: true
  });
  
  try {
    const activeElement = win.document.activeElement;
    if (activeElement) {
      // Set the value
      if (activeElement.value !== undefined) {
        activeElement.value = text;
      } else {
        activeElement.textContent = text;
      }
      
      // Dispatch input event
      activeElement.dispatchEvent(inputEvent);
      console.log(`Typed "${text}" into active field`);
    }
  } catch (e) {
    console.log('Failed to type text:', e);
  }
}

// Select all text in the current field
function selectAllInField(win) {
  sendKeySequence(win, 'a', 'KeyA', true);
  console.log('Selected all text in field');
}

// Click "Replace All" button
function replaceAll(win) {
  // Try to find and click the Replace All button
  const replaceAllButton = win.document.querySelector('[aria-label*="Replace all"], [data-tooltip*="Replace all"], button[title*="Replace all"]');
  
  if (replaceAllButton) {
    replaceAllButton.click();
    console.log('Clicked Replace All button');
  } else {
    // Fallback: try keyboard shortcut for Replace All
    sendKeySequence(win, 'Enter', 'Enter', true);
    console.log('Used keyboard shortcut for Replace All');
  }
}

// Close Find & Replace dialog
function closeFindReplace(win) {
  sendKeySequence(win, 'Escape', 'Escape', false);
  console.log('Closed Find & Replace dialog');
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
  
  if (message.action === 'formatAllInstances') {
    const { phrase, styles } = message;
    if (!phrase) {
      showNotification('Please enter a word or phrase to format.', true);
      sendResponse({ success: false });
      return;
    }
    
    const success = findAndFormatAllInstances(phrase, styles);
    sendResponse({ success });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Docs Word Styler v3.0 initialized - Find & Format All Instances');
  });
} else {
  console.log('Docs Word Styler v3.0 initialized - Find & Format All Instances');
}

console.log('Docs Word Styler v3.0 content script loaded successfully');