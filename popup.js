document.addEventListener('DOMContentLoaded', async () => {
  const phraseInput = document.getElementById('phrase');
  const boldCheckbox = document.getElementById('bold');
  const italicCheckbox = document.getElementById('italic');
  const underlineCheckbox = document.getElementById('underline');
  const applyButton = document.getElementById('applyStyles');

  // Check if we're on a Google Docs page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isGoogleDocs = tab.url && tab.url.includes('docs.google.com');
  
  if (!isGoogleDocs) {
    applyButton.textContent = 'Not on Google Docs';
    applyButton.disabled = true;
    return;
  }

  // Try to get current selection info
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'captureSelection' });
    if (response && response.selection && response.selection.text) {
      phraseInput.value = response.selection.text;
      phraseInput.placeholder = `Selected: "${response.selection.text}"`;
    }
  } catch (error) {
    console.log('Could not get selection:', error);
  }

  applyButton.addEventListener('click', async () => {
    const styles = {
      bold: boldCheckbox.checked,
      italic: italicCheckbox.checked,
      underline: underlineCheckbox.checked
    };

    // Check if any style is selected
    if (!styles.bold && !styles.italic && !styles.underline) {
      alert('Please select at least one formatting option (Bold, Italic, or Underline)');
      return;
    }

    try {
      // Send formatting command using proven method
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'applyFormatting',
        styles
      });

      if (response && response.success) {
        // Show success and close popup
        const appliedStyles = Object.keys(styles).filter(k => styles[k]).join(', ');
        
        // Close popup after brief delay
        setTimeout(() => {
          window.close();
        }, 800);
      } else {
        alert('Could not apply formatting. Please select text in Google Docs first.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error applying styles. Make sure you are on a Google Docs page and have text selected.');
    }
  });

  // Auto-focus on phrase input if empty
  if (!phraseInput.value) {
    phraseInput.focus();
  }
});