/**
 * Bulk Italicise - Google Docs Add-on
 * Italicises all instances of a specified word case-insensitively
 */

/**
 * Called when the add-on is installed
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Called when the document is opened - creates the menu
 */
function onOpen() {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Italicise word…', 'showPrompt')
    .addSeparator()
    .addItem('Run Demo', 'runDemo')
    .addToUi();
}

/**
 * Shows a prompt dialog for user to enter the target word
 */
function showPrompt() {
  const ui = DocumentApp.getUi();
  
  const response = ui.prompt(
    'Bulk Italicise',
    'Enter the word to italicise (case-insensitive):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const targetWord = response.getResponseText().trim();
    
    if (targetWord) {
      const count = italiciseWord(targetWord);
      ui.alert(
        'Bulk Italicise Complete',
        `Italicised ${count} instance(s) of "${targetWord}"`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('Error', 'Please enter a valid word.', ui.ButtonSet.OK);
    }
  }
}

/**
 * Italicises all instances of the specified word in the document
 * @param {string} targetWord - The word to italicise
 * @return {number} Number of instances italicised
 */
function italiciseWord(targetWord) {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  let count = 0;
  
  // Create case-insensitive regex pattern with word boundaries
  const searchPattern = new RegExp(`\\b${escapeRegex(targetWord)}\\b`, 'gi');
  
  // Get all text elements in the document
  const textElements = [];
  findTextElements(body, textElements);
  
  // Process each text element
  textElements.forEach(function(element) {
    const text = element.getText();
    let match;
    
    // Find all matches in this text element
    while ((match = searchPattern.exec(text)) !== null) {
      const startOffset = match.index;
      const endOffset = startOffset + match[0].length - 1;
      
      // Apply italic formatting to this match
      element.setItalic(startOffset, endOffset, true);
      count++;
    }
  });
  
  return count;
}

/**
 * Recursively finds all text elements in the document
 * @param {GoogleAppsScript.Document.Element} element - The element to search
 * @param {Array} textElements - Array to store found text elements
 */
function findTextElements(element, textElements) {
  if (element.getType() === DocumentApp.ElementType.TEXT) {
    textElements.push(element.asText());
  }
  
  if (element.getNumChildren) {
    for (let i = 0; i < element.getNumChildren(); i++) {
      findTextElements(element.getChild(i), textElements);
    }
  }
}

/**
 * Escapes special regex characters in a string
 * @param {string} string - The string to escape
 * @return {string} The escaped string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Demo function for testing - italicises the word "test"
 * Creates a test paragraph and applies italics to demonstrate functionality
 */
function runDemo() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  
  // Add a test paragraph with various cases of "test"
  const testParagraph = body.appendParagraph(
    'Demo paragraph: This is a test. Testing the TEST function with Test cases and test123 mixed.'
  );
  
  // Wait a moment for the document to update
  Utilities.sleep(100);
  
  // Apply italics to "test"
  const count = italiciseWord('test');
  
  // Show result
  DocumentApp.getUi().alert(
    'Demo Complete',
    `Demo added test paragraph and italicised ${count} instance(s) of "test"`,
    DocumentApp.getUi().ButtonSet.OK
  );
}