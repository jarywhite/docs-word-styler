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

// Click a Google Docs toolbar button with focus management
function clickGoogleDocsButton(buttonType) {
  const button = findButton(buttonType);
  if (!button) {
    console.log(`❌ ${buttonType} button not found`);
    return false;
  }
  
  try {
    console.log(`🔍 DEBUG: About to click ${buttonType} button:`, {
      element: button,
      classList: button.classList.toString(),
      disabled: button.disabled,
      style: button.style.cssText,
      ariaPressed: button.getAttribute('aria-pressed'),
      activeElement: document.activeElement
    });
    
    // Check current document selection
    const selection = window.getSelection();
    console.log(`🔍 Current selection before ${buttonType}:`, {
      text: selection.toString(),
      rangeCount: selection.rangeCount,
      anchorNode: selection.anchorNode,
      isCollapsed: selection.isCollapsed
    });
    
    // CRITICAL: Clear focus from any existing elements to prevent blocking
    if (document.activeElement && document.activeElement !== document.body) {
      console.log('🔍 Clearing focus from:', document.activeElement);
      document.activeElement.blur();
    }
    
    // Find and focus the document editing area
    const docFrame = document.querySelector('iframe[aria-label*="Document content"]') || 
                     document.querySelector('.docs-texteventtarget-iframe') ||
                     document.querySelector('.kix-appview-editor');
    
    if (docFrame) {
      console.log('🔍 Focusing document frame for formatting');
      docFrame.focus();
    }
    
    // Small delay to ensure focus is established
    setTimeout(() => {
      // Now click the formatting button
      console.log(`🔍 Clicking ${buttonType} button with proper focus`);
      
      // Use both click methods
      button.click();
      
      // Also dispatch detailed mouse events
      ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        const mouseEvent = new MouseEvent(eventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          button: 0,
          detail: 1
        });
        button.dispatchEvent(mouseEvent);
      });
      
      // Check if button state changed after click
      setTimeout(() => {
        console.log(`🔍 DEBUG: After clicking ${buttonType} button:`, {
          ariaPressed: button.getAttribute('aria-pressed'),
          classList: button.classList.toString(),
          activeElement: document.activeElement,
          documentHasFocus: document.hasFocus()
        });
        
        // Check if selection changed
        const newSelection = window.getSelection();
        console.log(`🔍 Selection after ${buttonType}:`, {
          text: newSelection.toString(),
          rangeCount: newSelection.rangeCount,
          hasFormatting: checkTextFormatting(newSelection)
        });
      }, 150);
      
    }, 50);
    
    console.log(`✅ Clicked ${buttonType} button successfully`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to click ${buttonType} button:`, error);
    return false;
  }
}

// Check if selected text has formatting applied
function checkTextFormatting(selection) {
  if (selection.rangeCount === 0) return null;
  
  try {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
    
    return {
      fontWeight: window.getComputedStyle(element).fontWeight,
      fontStyle: window.getComputedStyle(element).fontStyle,
      textDecoration: window.getComputedStyle(element).textDecoration,
      innerHTML: element.innerHTML
    };
  } catch (e) {
    return { error: e.message };
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

// DOM mutation observer to monitor text changes
let mutationObserver = null;

function startDOMMonitoring() {
  console.log('🔍 Starting DOM mutation monitoring...');
  
  if (mutationObserver) {
    mutationObserver.disconnect();
  }
  
  mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        console.log('🔍 DOM CHANGE DETECTED:', {
          type: mutation.type,
          target: mutation.target,
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
          targetText: mutation.target.textContent?.substring(0, 50)
        });
        
        // Check for formatting changes in text nodes
        if (mutation.target.nodeType === Node.TEXT_NODE && mutation.target.parentElement) {
          const element = mutation.target.parentElement;
          const computedStyle = window.getComputedStyle(element);
          console.log('🔍 Text node formatting:', {
            text: mutation.target.textContent?.substring(0, 20),
            fontWeight: computedStyle.fontWeight,
            fontStyle: computedStyle.fontStyle,
            textDecoration: computedStyle.textDecoration,
            tagName: element.tagName
          });
        }
      }
    });
  });
  
  // Monitor the entire document with detailed options
  mutationObserver.observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
    characterDataOldValue: true
  });
}

function stopDOMMonitoring() {
  console.log('🔍 Stopping DOM mutation monitoring...');
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
}

// Find and format all instances using UI automation
function formatAllInstancesViaUI(phrase, styles) {
  console.log(`🎯 Formatting all instances of "${phrase}" using UI automation`);
  
  // Start monitoring DOM changes
  startDOMMonitoring();
  
  // Step 1: Open Find & Replace
  if (!openFindAndReplace()) {
    stopDOMMonitoring();
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
          // Step 5: Replace all first (without pre-formatting)
          replaceAllViaUI();
          
          setTimeout(() => {
            // Step 6: Close dialog
            closeFindReplaceDialog();
            
            setTimeout(() => {
              // Step 7: Now find and format the replaced text in the document
              formatReplacedTextInDocument(phrase, styles);
              
              // Stop DOM monitoring after a delay to catch any final changes
              setTimeout(() => {
                stopDOMMonitoring();
              }, 2000);
              
              showNotification(`✅ Applied formatting to all instances of "${phrase}"!`);
            }, 500);
            
          }, 500);
          
        }, 300);
        
      }, 300);
      
    }, 500);
    
  }, 700); // Give time for dialog to open
  
  return true;
}

// Enhanced focus state tracking
function logFocusState(context) {
  const activeElement = document.activeElement;
  const selection = window.getSelection();
  
  console.log(`🔍 FOCUS STATE [${context}]:`, {
    activeElement: {
      tagName: activeElement?.tagName,
      id: activeElement?.id,
      className: activeElement?.className,
      value: activeElement?.value,
      textContent: activeElement?.textContent?.substring(0, 30),
      contentEditable: activeElement?.contentEditable
    },
    selection: {
      text: selection.toString().substring(0, 30),
      rangeCount: selection.rangeCount,
      isCollapsed: selection.isCollapsed,
      anchorNode: selection.anchorNode?.nodeName,
      focusNode: selection.focusNode?.nodeName
    },
    documentHasFocus: document.hasFocus(),
    timestamp: new Date().toISOString()
  });
}

// Type text in the currently active field
function typeInActiveField(text) {
  logFocusState(`Before typing "${text}"`);
  
  const activeElement = document.activeElement;
  if (!activeElement) {
    console.log('❌ No active element found for typing');
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
  
  setTimeout(() => {
    logFocusState(`After typing "${text}"`);
  }, 50);
}

// Press Tab key to move between fields
function pressTab() {
  logFocusState('Before Tab press');
  
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
  
  setTimeout(() => {
    logFocusState('After Tab press');
  }, 100);
}

// Select all text in active field with detailed debugging
function selectAllInActiveField() {
  console.log('🔍 DEBUG: Selecting all text in active field');
  logFocusState('Before selecting all text');
  
  const activeElement = document.activeElement;
  console.log('🔍 Active element details:', {
    tagName: activeElement?.tagName,
    type: activeElement?.type,
    value: activeElement?.value,
    textContent: activeElement?.textContent,
    contentEditable: activeElement?.contentEditable,
    className: activeElement?.className,
    id: activeElement?.id
  });
  
  if (activeElement) {
    if (activeElement.select) {
      activeElement.select();
      console.log('✅ Used element.select() method');
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
      console.log('✅ Sent Ctrl+A event');
    }
    
    // Check selection after attempting to select all
    setTimeout(() => {
      logFocusState('After selecting all text');
      
      const selection = window.getSelection();
      console.log('🔍 Selection after selectAll:', {
        text: selection.toString(),
        rangeCount: selection.rangeCount,
        anchorNode: selection.anchorNode?.nodeName,
        focusNode: selection.focusNode?.nodeName
      });
      
      // Also check if the active element's value/content is selected
      if (activeElement.selectionStart !== undefined) {
        console.log('🔍 Input selection:', {
          start: activeElement.selectionStart,
          end: activeElement.selectionEnd,
          selectedText: activeElement.value?.substring(activeElement.selectionStart, activeElement.selectionEnd)
        });
      }
    }, 50);
  } else {
    console.log('❌ No active element found for text selection');
  }
}

// Click Replace All button in Find & Replace dialog
function replaceAllViaUI() {
  console.log('Looking for Replace All button');
  logFocusState('Before replace all operation');
  
  // Try to find Replace All button
  const replaceAllSelectors = [
    '[aria-label*="Replace all"]',
    '[data-tooltip*="Replace all"]',
    'button[title*="Replace all"]',
    '.docs-findandreplace-replace-all',
    '[role="button"][aria-label*="Replace"]'
  ];
  
  for (const selector of replaceAllSelectors) {
    const button = document.querySelector(selector);
    if (button) {
      console.log(`Found Replace All button: ${selector}`);
      button.click();
      
      // Track what happens after clicking replace all
      setTimeout(() => {
        logFocusState('After replace all clicked');
      }, 200);
      
      return;
    }
  }
  
  // Alternative approach: Find buttons by text content
  const allButtons = document.querySelectorAll('button, [role="button"]');
  for (const button of allButtons) {
    const text = button.textContent?.trim().toLowerCase();
    if (text && (text.includes('replace all') || text.includes('replace'))) {
      console.log(`Found Replace All button by text: "${text}"`);
      button.click();
      
      // Track what happens after clicking replace all
      setTimeout(() => {
        logFocusState('After replace all clicked (text method)');
      }, 200);
      
      return;
    }
  }
  
  console.log('Replace All button not found, trying keyboard shortcuts');
  
  // Try multiple keyboard shortcuts
  const shortcuts = [
    { key: 'a', altKey: true },  // Alt+A
    { key: 'Enter', ctrlKey: true }, // Ctrl+Enter  
    { key: 'r', altKey: true }   // Alt+R
  ];
  
  shortcuts.forEach((shortcut, index) => {
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', {
        key: shortcut.key,
        code: `Key${shortcut.key.toUpperCase()}`,
        altKey: shortcut.altKey || false,
        ctrlKey: shortcut.ctrlKey || false,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      console.log(`Tried keyboard shortcut: ${JSON.stringify(shortcut)}`);
    }, index * 100);
  });
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
    const info = {
      id: button.id,
      className: button.className,
      ariaLabel: button.getAttribute('aria-label'),
      tooltip: button.getAttribute('data-tooltip'),
      title: button.getAttribute('title'),
      textContent: button.textContent?.trim()
    };
    
    console.log(`Button ${index}:`, info);
    
    // Highlight formatting buttons
    if (info.ariaLabel && (
      info.ariaLabel.toLowerCase().includes('bold') ||
      info.ariaLabel.toLowerCase().includes('italic') ||
      info.ariaLabel.toLowerCase().includes('underline') ||
      info.ariaLabel.toLowerCase().includes('replace')
    )) {
      console.log(`⭐ FORMATTING BUTTON ${index}:`, info);
    }
  });
  
  console.log(`Found ${buttons.length} total buttons`);
  
  // Also check for dialogs and modals
  const dialogs = document.querySelectorAll('[role="dialog"], .modal, .docs-findandreplace');
  if (dialogs.length > 0) {
    console.log('🔍 Found dialogs:', dialogs);
  }
}

// Format replaced text using sequential real-time discovery (DOM-mutation aware)
function formatReplacedTextInDocument(phrase, styles) {
  console.log(`🎯 Formatting replaced text in document: "${phrase}" (sequential approach)`);
  
  // Track formatted instances to prevent duplicates
  const formattedPositions = new Set();
  let processedCount = 0;
  let searchAttempts = 0;
  const maxAttempts = 50; // Reasonable limit for finding instances
  
  function findAndFormatNext() {
    if (searchAttempts >= maxAttempts) {
      console.log(`✅ Completed search after ${searchAttempts} attempts. Formatted ${processedCount} instances of "${phrase}"`);
      
      // Final verification
      setTimeout(() => {
        verifyFormattingInDocument(phrase, styles);
      }, 1000);
      return;
    }
    
    searchAttempts++;
    console.log(`🔍 Search attempt ${searchAttempts}: Looking for "${phrase}"`);
    
    // Clear any existing selection
    window.getSelection().removeAllRanges();
    
    // Use window.find to locate next instance (case-insensitive)
    let found = findNextInstance(phrase);
    
    if (found) {
      const selection = window.getSelection();
      
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const selectedText = selection.toString();
        const position = getSelectionPosition(selection);
        
        console.log(`✅ Found instance: "${selectedText}" at position ${position}`);
        
        // Check if we've already formatted this position
        if (formattedPositions.has(position)) {
          console.log(`⚠️ Already formatted position ${position}, continuing search...`);
          // Move cursor past this instance and continue
          moveSelectionPastCurrent();
          setTimeout(findAndFormatNext, 200);
          return;
        }
        
        // Mark this position as formatted
        formattedPositions.add(position);
        processedCount++;
        
        console.log(`🔥 Processing instance ${processedCount}: "${selectedText}" at position ${position}`);
        
        // Apply formatting to the selected text
        applyFormattingToCurrentSelection(styles, () => {
          // Wait for DOM to stabilize after formatting
          setTimeout(() => {
            // Continue searching for next instance
            findAndFormatNext();
          }, 600); // Longer delay to handle DOM mutations
        });
        
      } else {
        console.log(`❌ Found text but no valid selection, continuing search...`);
        setTimeout(findAndFormatNext, 200);
      }
    } else {
      console.log(`✅ No more instances found. Completed formatting ${processedCount} instances of "${phrase}"`);
      
      // Final verification
      setTimeout(() => {
        verifyFormattingInDocument(phrase, styles);
      }, 1000);
    }
  }
  
  // Start the sequential find-and-format process
  setTimeout(() => {
    console.log(`🔍 Starting sequential formatting of "${phrase}"`);
    findAndFormatNext();
  }, 200);
}

// Find next instance of phrase (case-insensitive)
function findNextInstance(phrase) {
  // Try original case first
  let found = window.find(phrase, false, false, true, false, true, false);
  
  if (!found && phrase.toLowerCase() !== phrase.toUpperCase()) {
    // Try uppercase version (common after Find & Replace)
    found = window.find(phrase.toUpperCase(), false, false, true, false, true, false);
  }
  
  if (!found && phrase.toUpperCase() !== phrase.toLowerCase()) {
    // Try lowercase version
    found = window.find(phrase.toLowerCase(), false, false, true, false, true, false);
  }
  
  return found;
}

// Get a position identifier for the current selection
function getSelectionPosition(selection) {
  if (selection.rangeCount === 0) return 'no-selection';
  
  try {
    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    
    // Create a unique position identifier based on:
    // 1. Text content of the container
    // 2. Start offset within the container  
    // 3. Some surrounding context
    const containerText = container.textContent || '';
    const offset = range.startOffset;
    const contextBefore = containerText.substring(Math.max(0, offset - 10), offset);
    const contextAfter = containerText.substring(offset, Math.min(containerText.length, offset + 20));
    
    return `${contextBefore}|${offset}|${contextAfter}`;
  } catch (error) {
    console.log('Error getting selection position:', error);
    return `fallback-${Date.now()}`;
  }
}

// Move selection past the current match to continue searching
function moveSelectionPastCurrent() {
  try {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const newRange = document.createRange();
      
      // Set cursor to end of current selection
      newRange.setStartAfter(range.endContainer);
      newRange.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      console.log('🔄 Moved cursor past current selection');
    }
  } catch (error) {
    console.log('Error moving selection:', error);
  }
}

// Apply formatting to current selection with DOM mutation handling
function applyFormattingToCurrentSelection(styles, callback) {
  const selection = window.getSelection();
  
  if (selection.rangeCount === 0 || selection.isCollapsed) {
    console.log(`❌ No valid selection for formatting`);
    callback();
    return;
  }
  
  const selectedText = selection.toString();
  console.log(`🎨 Applying formatting to: "${selectedText}"`);
  
  // Store the selection range for restoration
  const range = selection.getRangeAt(0).cloneRange();
  
  // Apply formatting sequentially with DOM stability monitoring
  let formatIndex = 0;
  const formats = [];
  
  if (styles.bold) formats.push('bold');
  if (styles.italic) formats.push('italic');
  if (styles.underline) formats.push('underline');
  
  function applyNextFormat() {
    if (formatIndex >= formats.length) {
      console.log(`✅ Applied all formatting to: "${selectedText}"`);
      callback();
      return;
    }
    
    const formatType = formats[formatIndex];
    formatIndex++;
    
    // Restore selection before applying format
    try {
      selection.removeAllRanges();
      selection.addRange(range.cloneRange());
      
      // Ensure document has focus
      const docFrame = document.querySelector('iframe[aria-label*="Document content"]') || 
                       document.querySelector('.docs-texteventtarget-iframe') ||
                       document.querySelector('.kix-appview-editor');
      
      if (docFrame) {
        docFrame.focus();
      }
      
      console.log(`🎨 Applying ${formatType} formatting...`);
      const success = clickGoogleDocsButton(formatType);
      console.log(`🎨 ${formatType} formatting result: ${success}`);
      
      // Wait longer for DOM mutations to settle
      setTimeout(applyNextFormat, 500);
      
    } catch (error) {
      console.log(`❌ Error applying ${formatType} formatting:`, error);
      setTimeout(applyNextFormat, 200);
    }
  }
  
  // Start applying formats
  applyNextFormat();
}


// New function to verify formatting was actually applied
function verifyFormattingInDocument(phrase, styles) {
  console.log(`🔍 VERIFICATION: Checking if formatting was applied to "${phrase}"`);
  
  // Search for the phrase in the document and check its formatting
  const found = window.find(phrase, false, false, true, false, true, false);
  
  if (found) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const formatting = checkTextFormatting(selection);
      console.log(`🔍 VERIFICATION RESULT for "${phrase}":`, formatting);
      
      // Check if expected formatting is present
      let hasExpectedFormatting = true;
      
      if (styles.bold && (!formatting.fontWeight || (formatting.fontWeight !== 'bold' && parseInt(formatting.fontWeight) < 600))) {
        console.log('❌ VERIFICATION FAILED: Bold formatting not applied');
        hasExpectedFormatting = false;
      }
      
      if (styles.italic && formatting.fontStyle !== 'italic') {
        console.log('❌ VERIFICATION FAILED: Italic formatting not applied');
        hasExpectedFormatting = false;
      }
      
      if (styles.underline && !formatting.textDecoration?.includes('underline')) {
        console.log('❌ VERIFICATION FAILED: Underline formatting not applied');
        hasExpectedFormatting = false;
      }
      
      if (hasExpectedFormatting) {
        console.log('✅ VERIFICATION PASSED: Expected formatting is present');
      } else {
        console.log('❌ VERIFICATION FAILED: Formatting was not properly applied');
        
        // Try alternative verification method
        console.log('🔍 Attempting alternative verification by examining DOM structure...');
        verifyFormattingInDOM(phrase, styles);
      }
    }
  } else {
    console.log('❌ VERIFICATION: Could not find phrase in document for verification');
  }
  
  // Clear selection
  window.getSelection().removeAllRanges();
}

// Alternative verification method that examines DOM structure
function verifyFormattingInDOM(phrase, styles) {
  console.log(`🔍 DOM VERIFICATION: Searching for formatted "${phrase}" in DOM`);
  
  // Search for text nodes containing the phrase
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.includes(phrase) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  let foundFormatted = false;
  let node;
  
  while (node = walker.nextNode()) {
    const element = node.parentElement;
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      const formatting = {
        fontWeight: computedStyle.fontWeight,
        fontStyle: computedStyle.fontStyle,
        textDecoration: computedStyle.textDecoration,
        tagName: element.tagName,
        text: node.textContent.substring(0, 50)
      };
      
      console.log(`🔍 Found text node containing "${phrase}":`, formatting);
      
      // Check if this instance has the expected formatting
      let isFormatted = true;
      if (styles.bold && (!formatting.fontWeight || (formatting.fontWeight !== 'bold' && parseInt(formatting.fontWeight) < 600))) {
        isFormatted = false;
      }
      if (styles.italic && formatting.fontStyle !== 'italic') {
        isFormatted = false;
      }
      if (styles.underline && !formatting.textDecoration?.includes('underline')) {
        isFormatted = false;
      }
      
      if (isFormatted) {
        console.log('✅ DOM VERIFICATION: Found properly formatted instance');
        foundFormatted = true;
      }
    }
  }
  
  if (!foundFormatted) {
    console.log('❌ DOM VERIFICATION FAILED: No properly formatted instances found');
  }
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
    
  } else if (message.action === 'testFormatting') {
    // Test formatting on currently selected text
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      console.log('🔍 Testing formatting on selected text:', selection.toString());
      const success = clickGoogleDocsButton('bold');
      console.log('🔍 Test formatting result:', success);
      
      // Verify formatting after a delay
      setTimeout(() => {
        const newSelection = window.getSelection();
        if (newSelection.rangeCount > 0) {
          const formatting = checkTextFormatting(newSelection);
          console.log('🔍 Test formatting verification:', formatting);
        }
      }, 200);
      
      sendResponse({ success: true });
    } else {
      console.log('❌ No text selected for test formatting');
      showNotification('Please select some text first before testing formatting', true);
      sendResponse({ success: false });
    }
    
  } else if (message.action === 'verifyFormatting') {
    // Manual verification command for testing
    const phrase = message.phrase || 'test';
    const styles = message.styles || { bold: true };
    
    console.log(`🔍 Manual verification requested for "${phrase}"`);
    verifyFormattingInDocument(phrase, styles);
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