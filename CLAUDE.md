# Docs Word Styler Chrome Extension

## Project Overview
Chrome extension for styling specific words and phrases in Google Docs with bold, italic, and underline formatting.

## Features
- Manifest V3 Chrome extension
- Content script for docs.google.com
- Popup UI for phrase input and style selection
- Multiple text detection methods to work with Google Docs' canvas rendering
- Real-time text mutation monitoring
- Selection-based formatting

## Architecture

### Files Structure
```
src/
├── content.js        # Content script with advanced Google Docs integration
popup.html            # Extension popup interface
popup.js              # Popup logic and communication
manifest.json         # Extension manifest (Manifest V3)
rollup.config.js      # Build configuration
```

### Key Components

**Content Script (`src/content.js`)**
- Page script injection for Google Docs API access
- MutationObserver for real-time text monitoring
- Multiple text detection methods:
  1. Selection-based formatting (most reliable)
  2. Document text detection via injected scripts
  3. Real-time mutation watching
  4. Native browser find functionality

**Popup Interface (`popup.html`)**
- Text input for phrase to style
- Checkboxes for bold, italic, underline
- Apply button to trigger formatting

## Development Commands

```bash
npm install           # Install dependencies
npm run dev          # Development build with watch
npm run build        # Production build
npm run test         # Run tests (when implemented)
```

## Google Docs Integration Challenges

Google Docs uses canvas-based rendering (since 2021) which makes traditional DOM manipulation difficult. This extension uses several advanced techniques:

1. **Page Context Injection** - Injects scripts into page context to access Google Docs internal APIs
2. **MutationObserver** - Monitors DOM changes for real-time text detection
3. **Selection-based Formatting** - Applies formatting to user-selected text using `document.execCommand`
4. **Browser Native Find** - Uses `window.find()` to locate text programmatically

## Usage

1. Install extension in Chrome
2. Open Google Docs document
3. Either:
   - Select text manually, then use extension to apply formatting
   - Enter phrase in extension popup and let it attempt automatic detection
4. Choose formatting options (bold, italic, underline)
5. Click "Apply Styles"

## Technical Notes

- Uses Rollup for building and bundling
- Implements Manifest V3 specifications
- Handles Google Docs' canvas rendering system
- Provides user notifications for feedback
- Includes fallback methods for text detection

## Current Status

- ✅ Extension framework complete
- ✅ Popup UI functional
- ✅ Content script communication working
- ✅ Advanced Google Docs integration implemented
- 🔄 Testing with Google Docs canvas rendering system

## Future Enhancements

- Add color formatting options
- Implement text highlighting
- Support for multiple phrase formatting
- Undo/redo functionality
- Export styled text options