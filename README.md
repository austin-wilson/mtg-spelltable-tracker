# MTG SpellTable Tracker

A Chrome Extension to track Magic: The Gathering Commander games on SpellTable and export stats to Google Sheets.

## Features

- Extracts player data from SpellTable
- Tracks game stats and player performance
- Pushes data to a Google Sheet for easy storage

## Installation

You can download the extension from the Chrome Web Store (coming soon) or load it locally in Developer Mode.

## Usage

To receive game data from the extension, create a new [Google Apps Script](https://script.google.com/) attached to your Google Sheet and paste in the following function.

Replace placeholders like `<SHEET_NAME>` with the actual values for your sheet configuration.

```
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('<SHEET_NAME>');
    if (!sheet) throw new Error('Sheet not found');

    const timestamp = new Date();
    const gameMeta = [
      timestamp,
      data.duration || '',
      data.numberOfPlayers || '',
      data.winner || '',
      data.winMethod || ''
    ];

    data.players.forEach(player => {
      const row = [
        ...gameMeta,
        player.playerSeat || '',
        player.playerName || '',
        player.playerCommander || '',
        player.playerKills || '',
        player.playerMulligans || '',
        player.playerMissedLands || '',
        player.playerCommanderCasts || '',
        player.playerCardsDrawn || '',
        player.playerInteractionUsed || '',
        player.playerBoardwipesUsed || '',
        player.playerTotalTime || ''
      ];
      sheet.appendRow(row);
    });

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
```

This script accepts JSON data sent by the extension and writes it into your sheet. Make sure to deploy the script as a web app and use that URL in the extension setup.
