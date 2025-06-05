chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshData') {
    try {
      const playerContainers = document.querySelectorAll('div.w-1\\/2');
      const players = [];

      let seatCounter = 1;

      playerContainers.forEach(container => {
        const playerNameEl = container.querySelector('.font-bold.flex.truncate');
        const commanderEl = container.querySelector('.text-xs.italic');

        const playerName = playerNameEl?.textContent.trim();
        const commanderText = commanderEl?.textContent.trim();
        const playerCommander = (commanderText && !commanderText.includes("No commander")) ? commanderText : '';

        if (playerName) {
          players.push({
            playerName,
            playerCommander,
            playerSeat: seatCounter.toString(),
            playerKills: '',
            playerMulligans: '',
            playerMissedLands: '',
            playerCommanderCasts: '',
            playerCardsDrawn: '',
            playerInteractionUsed: '',
            playerBoardwipesUsed: '',
            playerTotalTime: ''
          });

          seatCounter++; // Only increment if a real player was found
        }
      });

      const gameData = {
        numberOfPlayers: players.length,
        duration: '',
        winner: '',
        winMethod: '',
        players
      };

      console.log('[content.js] Extracted game data:', gameData);
      sendResponse({ success: true, data: gameData });
    } catch (e) {
      console.error('[content.js] Error scraping SpellTable data:', e);
      sendResponse({ success: false });
    }

    return true; // Keeps message channel open for async response
  }
});
