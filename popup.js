document.addEventListener('DOMContentLoaded', () => {
  const phraseInput = document.getElementById('phrase');
  const boldCheckbox = document.getElementById('bold');
  const italicCheckbox = document.getElementById('italic');
  const underlineCheckbox = document.getElementById('underline');
  const applyButton = document.getElementById('applyStyles');

  applyButton.addEventListener('click', async () => {
    const phrase = phraseInput.value.trim();
    if (!phrase) {
      alert('Please enter a phrase to style');
      return;
    }

    const styles = {
      bold: boldCheckbox.checked,
      italic: italicCheckbox.checked,
      underline: underlineCheckbox.checked
    };

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // SIMPLE: Just send the formatting commands immediately
      await chrome.tabs.sendMessage(tab.id, {
        action: 'applyFormatting',
        styles
      });

      // Close popup and show instruction
      alert(`Extension sent ${Object.keys(styles).filter(k => styles[k]).join(', ')} commands to Google Docs.\n\nMAKE SURE "${phrase}" IS SELECTED and try pressing Ctrl+B, Ctrl+I, Ctrl+U manually if needed.`);
      window.close();
    } catch (error) {
      console.error('Error:', error);
      alert('Error applying styles. Make sure you are on a Google Docs page.');
    }
  });
});