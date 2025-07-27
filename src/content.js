console.log('Docs Word Styler v4.0 - UI Button Clicking Approach');

// Google Docs toolbar button selectors (based on research)
const GOOGLE_DOCS_BUTTONS = {
  bold: [
    '#boldButton',
    '[aria-label*="Bold"]',
    '[data-tooltip*="Bold"]',
    '.docs-icon-bold',
    '[role="button"][aria-label*="Bold"]'
  ],
  italic: [
    '#italicButton', 
    '[aria-label*="Italic"]',
    '[data-tooltip*="Italic"]',
    '.docs-icon-italic',
    '[role="button"][aria-label*="Italic"]'
  ],
  underline: [
    '#underlineButton',
    '[aria-label*="Underline"]', 
    '[data-tooltip*="Underline"]',
    '.docs-icon-underline',
    '[role="button"][aria-label*="Underline"]'
  ],
  findReplace: [
    '[aria-label*="Find and replace"]',
    '[data-tooltip*="Find and replace"]',
    '.docs-icon-find-replace'
  ]
};

// Find a button using multiple selectors
function findButton(buttonType) {
  const selectors = GOOGLE_DOCS_BUTTONS[buttonType];
  if (!selectors) return null;
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) {
      console.log(`Found ${buttonType} button using selector: ${selector}`);
      return button;
    }
  }
  
  console.log(`Could not find ${buttonType} button`);
  return null;
}

// Click a Google Docs toolbar button
function clickGoogleDocsButton(buttonType) {
  const button = findButton(buttonType);
  if (!button) {
    console.log(`❌ ${buttonType} button not found`);
    return false;
  }
  
  try {
    // Focus the button first
    button.focus();
    
    // Try multiple click methods
    button.click();
    
    // Also dispatch mouse events as backup
    const mouseEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      button: 0
    });
    button.dispatchEvent(mouseEvent);
    
    console.log(`✅ Clicked ${buttonType} button successfully`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to click ${buttonType} button:`, error);
    return false;
  }
}

// Open Find & Replace using UI clicking
function openFindAndReplace() {
  console.log('🔍 Opening Find & Replace dialog...');
  
  // Try to find and click Find & Replace button
  const findReplaceButton = findButton('findReplace');
  if (findReplaceButton) {
    return clickGoogleDocsButton('findReplace');
  }
  
  // Fallback: try keyboard shortcut
  console.log('Find & Replace button not found, trying Ctrl+H');
  const event = new KeyboardEvent('keydown', {
    key: 'h',
    code: 'KeyH',
    ctrlKey: true,
    bubbles: true,
    cancelable: true
  });
  
  document.dispatchEvent(event);
  return true;
}

// Find and format all instances using UI automation
function formatAllInstancesViaUI(phrase, styles) {
  console.log(`🎯 Formatting all instances of "${phrase}" using UI automation`);
  
  // Step 1: Open Find & Replace
  if (!openFindAndReplace()) {
    showNotification('Could not open Find & Replace dialog', true);
    return false;
  }
  
  // Wait for dialog to open
  setTimeout(() => {
    // Step 2: Type the search phrase
    typeInActiveField(phrase);
    
    setTimeout(() => {
      // Step 3: Move to replace field (Tab key)
      pressTab();
      
      setTimeout(() => {
        // Step 4: Type the replacement phrase
        typeInActiveField(phrase);
        
        setTimeout(() => {
          // Step 5: Select the replacement text
          selectAllInActiveField();
          
          setTimeout(() => {
            // Step 6: Apply formatting by clicking toolbar buttons
            if (styles.bold) {
              clickGoogleDocsButton('bold');
            }
            
            setTimeout(() => {
              if (styles.italic) {
                clickGoogleDocsButton('italic');
              }
              
              setTimeout(() => {
                if (styles.underline) {
                  clickGoogleDocsButton('underline');
                }
                
                setTimeout(() => {
                  // Step 7: Replace all
                  replaceAllViaUI();
                  
                  setTimeout(() => {
                    // Step 8: Close dialog
                    closeFindReplaceDialog();
                    showNotification(`✅ Applied formatting to all instances of "${phrase}"!`);
                  }, 500);
                  
                }, 200);
                
              }, 200);
              
            }, 200);
            
          }, 300);
          
        }, 300);
        
      }, 300);
      
    }, 500);
    
  }, 700); // Give time for dialog to open
  
  return true;
}

// Type text in the currently active field
function typeInActiveField(text) {
  const activeElement = document.activeElement;
  if (!activeElement) {
    console.log('No active element found for typing');
    return;
  }
  
  console.log(`Typing "${text}" in active field`);
  
  // Set the value
  if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
    activeElement.value = text;
    
    // Trigger input events
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // For contenteditable elements
    activeElement.textContent = text;
    
    // Trigger input event
    activeElement.dispatchEvent(new InputEvent('input', {
      data: text,
      inputType: 'insertText',
      bubbles: true
    }));
  }
}

// Press Tab key to move between fields
function pressTab() {
  console.log('Pressing Tab key');
  const tabEvent = new KeyboardEvent('keydown', {
    key: 'Tab',
    code: 'Tab',
    bubbles: true,
    cancelable: true
  });
  
  document.dispatchEvent(tabEvent);
  
  // Also try on active element
  if (document.activeElement) {
    document.activeElement.dispatchEvent(tabEvent);
  }
}

// Select all text in active field
function selectAllInActiveField() {
  console.log('Selecting all text in active field');
  
  const activeElement = document.activeElement;
  if (activeElement) {
    if (activeElement.select) {
      activeElement.select();
    } else {
      // Try Ctrl+A
      const selectAllEvent = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      activeElement.dispatchEvent(selectAllEvent);
    }
  }
}

// Click Replace All button in Find & Replace dialog
function replaceAllViaUI() {
  console.log('Looking for Replace All button');
  
  // Try to find Replace All button
  const replaceAllSelectors = [
    '[aria-label*="Replace all"]',
    '[data-tooltip*="Replace all"]',
    'button[title*="Replace all"]',
    '.docs-findandreplace-replace-all',
    '[role="button"]:contains("Replace all")'
  ];
  
  for (const selector of replaceAllSelectors) {
    const button = document.querySelector(selector);
    if (button) {
      console.log(`Found Replace All button: ${selector}`);
      button.click();
      return;
    }
  }
  
  console.log('Replace All button not found, trying Alt+A');
  // Fallback: Alt+A is often the shortcut for Replace All
  const altAEvent = new KeyboardEvent('keydown', {
    key: 'a',
    code: 'KeyA',
    altKey: true,
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(altAEvent);
}

// Close Find & Replace dialog
function closeFindReplaceDialog() {
  console.log('Closing Find & Replace dialog');
  
  // Try to find close button
  const closeSelectors = [
    '[aria-label*="Close"]',
    '[data-tooltip*="Close"]',
    '.docs-findandreplace-close',
    '.modal-dialog-title-close'
  ];
  
  for (const selector of closeSelectors) {
    const button = document.querySelector(selector);
    if (button) {
      console.log(`Found close button: ${selector}`);
      button.click();
      return;
    }
  }
  
  // Fallback: Escape key
  console.log('Close button not found, trying Escape key');
  const escEvent = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(escEvent);
}

// Debug function to list all available buttons
function debugListAllButtons() {
  console.log('🔍 DEBUG: Listing all buttons in Google Docs');
  
  const buttons = document.querySelectorAll('button, [role="button"]');
  buttons.forEach((button, index) => {
    console.log(`Button ${index}:`, {
      id: button.id,
      className: button.className,
      ariaLabel: button.getAttribute('aria-label'),
      tooltip: button.getAttribute('data-tooltip'),
      textContent: button.textContent?.trim().substring(0, 50)
    });
  });
  
  console.log(`Found ${buttons.length} total buttons`);
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
    
    // Debug: List all buttons first
    debugListAllButtons();
    
    const success = formatAllInstancesViaUI(phrase, styles);
    sendResponse({ success });
    
  } else if (message.action === 'debugButtons') {
    // Debug command to list buttons
    debugListAllButtons();
    sendResponse({ success: true });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Docs Word Styler v4.0 initialized - UI Button Clicking');
  });
} else {
  console.log('Docs Word Styler v4.0 initialized - UI Button Clicking');
}

console.log('Docs Word Styler v4.0 content script loaded successfully');