chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'manualPush') {
    const data = message.data;

    chrome.storage.sync.get('spellTableUrl', ({ spellTableUrl }) => {
      if (!spellTableUrl) {
        sendResponse({ success: false, error: 'No Apps Script URL saved.' });
        return;
      }
      
      const formBody = new URLSearchParams();
      formBody.append('data', JSON.stringify(data));

      fetch(spellTableUrl, {
        method: 'POST',
        body: formBody
      })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          return response.json();
        })
        .then(json => {
          if (json.success) {
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: json.error || 'Unknown error' });
          }
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
    });

    return true; // async response
  }
});
