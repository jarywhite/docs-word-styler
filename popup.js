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

  // Update button text to reflect the actual functionality
  applyButton.textContent = 'Format All Instances';

  // Set focus on phrase input
  phraseInput.focus();
  phraseInput.placeholder = 'Enter word to format (e.g., "dopamine")';

  applyButton.addEventListener('click', async () => {
    const phrase = phraseInput.value.trim();
    if (!phrase) {
      alert('Please enter a word or phrase to format throughout the document.');
      return;
    }

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
      // Send the find and format all instances command
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'formatAllInstances',
        phrase: phrase,
        styles: styles
      });

      if (response && response.success) {
        // Show success message
        const appliedStyles = Object.keys(styles).filter(k => styles[k]).join(', ');
        alert(`✅ Applying ${appliedStyles} formatting to all instances of "${phrase}"!\n\nWatch Google Docs for the Find & Replace dialog.`);
        
        // Close popup after brief delay
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        alert('Could not start formatting process. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error applying styles. Make sure you are on a Google Docs page.');
    }
  });

  // Allow Enter key to trigger formatting
  phraseInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyButton.click();
    }
  });
});