document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const saveUrlBtn = document.getElementById('saveUrlBtn');
  const urlSection = document.getElementById('urlSection');
  const dataSection = document.getElementById('dataSection');
  const statusText = document.getElementById('statusText');

  const gameDateEl = document.getElementById('gameDate');
  const locationEl = document.getElementById('location');
  const numberOfPlayersInput = document.getElementById('numberOfPlayers');
  const durationInput = document.getElementById('duration');
  const winnerInput = document.getElementById('winner');
  const winMethodInput = document.getElementById('winMethod');

  const playerSelect = document.getElementById('playerSelect');
  const playerDataSection = document.getElementById('playerDataSection');
  const manualPushBtn = document.getElementById('manualPush');
  const refreshDataBtn = document.getElementById('refreshDataBtn');

  const playerFields = [
    { label: 'Player Name', id: 'playerName' },
    { label: 'Commander', id: 'playerCommander' },
    { label: 'Seat Position', id: 'playerSeat' },
    { label: 'Kills', id: 'playerKills' },
    { label: 'Mulligans', id: 'playerMulligans' },
    { label: 'Missed Land Drops', id: 'playerMissedLands' },
    { label: 'Commander Casts', id: 'playerCommanderCasts' },
    { label: 'Cards Drawn', id: 'playerCardsDrawn' },
    { label: 'Interaction Used', id: 'playerInteractionUsed' },
    { label: 'Boardwipes Used', id: 'playerBoardwipesUsed' },
    { label: 'Total Time (min)', id: 'playerTotalTime' }
  ];

  // Start with 4 players max
  let inMemoryGameData = {
    numberOfPlayers: 4,
    duration: '',
    winner: '',
    winMethod: '',
    players: Array.from({ length: 4 }, () => ({}))
  };

  function initStaticFields() {
    gameDateEl.textContent = new Date().toLocaleDateString();
    locationEl.textContent = "Online";
  }

  refreshDataBtn.addEventListener('click', () => {
    statusText.textContent = 'Refreshing...';

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs.length) {
        statusText.textContent = 'Error: No active tab';
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshData' }, response => {
        if (response && response.success && response.data) {
          inMemoryGameData = response.data;

          // Ensure 4 total player objects
          while (inMemoryGameData.players.length < 4) {
            inMemoryGameData.players.push({});
          }

          // Count how many players have any data (basic check)
          const nonEmptyPlayers = inMemoryGameData.players.filter(p =>
            Object.values(p).some(v => v && v.toString().trim() !== '')
          ).length;

          inMemoryGameData.numberOfPlayers = Math.max(nonEmptyPlayers, 1);
          numberOfPlayersInput.value = inMemoryGameData.numberOfPlayers;


          populatePlayerSelect(); // will always show Player 1-4 options
          // Maintain current selected player or default to 1
          const currentPlayer = parseInt(playerSelect.value) || 1;
          playerSelect.value = currentPlayer.toString();
          playerSelect.setAttribute('data-prev', currentPlayer.toString());

          renderPlayerFields(currentPlayer);

          saveAllData();
          statusText.textContent = 'Refresh Complete';
        } else {
          statusText.textContent = 'Error refreshing data';
        }
      });
    });
  });

  function renderPlayerFields(playerNum) {
    playerDataSection.innerHTML = '';

    const playerData = inMemoryGameData.players[playerNum - 1] || {};

    playerFields.forEach(field => {
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'field';

      const label = document.createElement('label');
      label.textContent = `Player ${playerNum} ${field.label}:`;
      label.setAttribute('for', `${field.id}_${playerNum}`);

      const input = document.createElement('input');
      input.type = 'text';
      input.id = `${field.id}_${playerNum}`;
      input.name = `${field.id}_${playerNum}`;
      input.value = playerData[field.id] || '';

      input.addEventListener('input', e => {
        inMemoryGameData.players[playerNum - 1][field.id] = e.target.value;
        saveAllData();
      });

      fieldDiv.appendChild(label);
      fieldDiv.appendChild(input);
      playerDataSection.appendChild(fieldDiv);
    });
  }

  function saveGameDataInputs() {
    inMemoryGameData.numberOfPlayers = parseInt(numberOfPlayersInput.value) || 4;
    inMemoryGameData.duration = durationInput.value;
    inMemoryGameData.winner = winnerInput.value;
    inMemoryGameData.winMethod = winMethodInput.value;
  }

  // Populate game fields (non-player) only
  function populateGameDataInputs() {
    durationInput.value = inMemoryGameData.duration || '';
    winnerInput.value = inMemoryGameData.winner || '';
    winMethodInput.value = inMemoryGameData.winMethod || '';
    numberOfPlayersInput.value = inMemoryGameData.numberOfPlayers || 4;
  }

  function saveAllData() {
    saveGameDataInputs();
    chrome.storage.sync.set({ gameData: inMemoryGameData });
  }

  function resetGameDataWithInitialInfo() {
    inMemoryGameData = {
      numberOfPlayers: 4,
      duration: '',
      winner: '',
      winMethod: '',
      players: Array.from({ length: 4 }, () => ({}))
    };

    populateGameDataInputs();
    renderPlayerFields(1);
    saveAllData();
  }

  saveUrlBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert('Please enter a valid URL.');
      return;
    }

    chrome.storage.sync.set({ spellTableUrl: url }, () => {
      urlSection.style.display = 'none';
      dataSection.style.display = 'block';

      chrome.storage.sync.get('gameData', result => {
        if (result.gameData) {
          inMemoryGameData = result.gameData;
          // Ensure 4 players always
          while (inMemoryGameData.players.length < 4) {
            inMemoryGameData.players.push({});
          }
          if (!inMemoryGameData.numberOfPlayers || inMemoryGameData.numberOfPlayers < 1) {
            inMemoryGameData.numberOfPlayers = 4;
          }
        }
        initStaticFields();
        populateGameDataInputs();
        renderPlayerFields(1);
      });
    });
  });

  function checkSavedUrl() {
    chrome.storage.sync.get(['spellTableUrl', 'gameData'], result => {
      if (result.spellTableUrl) {
        urlInput.value = result.spellTableUrl;
        urlSection.style.display = 'none';
        dataSection.style.display = 'block';

        if (result.gameData) {
          inMemoryGameData = result.gameData;
          // Ensure 4 players always
          while (inMemoryGameData.players.length < 4) {
            inMemoryGameData.players.push({});
          }
          if (!inMemoryGameData.numberOfPlayers || inMemoryGameData.numberOfPlayers < 1) {
            inMemoryGameData.numberOfPlayers = 4;
          }
        }

        initStaticFields();
        populateGameDataInputs();
        renderPlayerFields(1);
      }
    });
  }

  // Player dropdown always shows players 1-4
  function populatePlayerSelect() {
    // Clear all options first
    playerSelect.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
      const option = document.createElement('option');
      option.value = i.toString();
      option.textContent = `Player ${i}`;
      playerSelect.appendChild(option);
    }
  }

  playerSelect.addEventListener('change', () => {
    const oldPlayerNum = playerSelect.getAttribute('data-prev') || '1';

    // Save previous player's input values before switching
    playerFields.forEach(field => {
      const input = document.getElementById(`${field.id}_${oldPlayerNum}`);
      if (input) {
        inMemoryGameData.players[oldPlayerNum - 1][field.id] = input.value;
      }
    });

    const newPlayerNum = parseInt(playerSelect.value);
    renderPlayerFields(newPlayerNum);
    playerSelect.setAttribute('data-prev', newPlayerNum.toString());

    saveAllData();
  });

  manualPushBtn.addEventListener('click', () => {
    saveGameDataInputs();

    const currentPlayerNum = parseInt(playerSelect.value);
    playerFields.forEach(field => {
      const input = document.getElementById(`${field.id}_${currentPlayerNum}`);
      if (input) {
        inMemoryGameData.players[currentPlayerNum - 1][field.id] = input.value;
      }
    });

    // Add empty string playerColors if missing for all players
    inMemoryGameData.players.forEach(player => {
      if (!player.hasOwnProperty('playerColors')) {
        player.playerColors = '';
      }
    });

    const gameDataToSend = {
      gameData: {
        "Game Date": gameDateEl.textContent,
        "Location": locationEl.textContent,
        "Number of Players": inMemoryGameData.numberOfPlayers,
        "Game Duration (min)": inMemoryGameData.duration,
        "Winner": inMemoryGameData.winner,
        "Win Method": inMemoryGameData.winMethod
      },
      players: inMemoryGameData.players.slice(0, inMemoryGameData.numberOfPlayers).map(p => ({
        "Player Name": p.playerName || "",
        "Commander": p.playerCommander || "",
        "Colors": "", // color picker UI not implemented yet
        "Seat Position": p.playerSeat || "",
        "Kills": p.playerKills || "",
        "Mulligans": p.playerMulligans || "",
        "Missed Land Drops": p.playerMissedLands || "",
        "Commander Casts": p.playerCommanderCasts || "",
        "Cards Drawn": p.playerCardsDrawn || "",
        "Interaction Used": p.playerInteractionUsed || "",
        "Boardwipes Used": p.playerBoardwipesUsed || "",
        "Total Time (min)": p.playerTotalTime || ""
      }))
    };

    chrome.runtime.sendMessage({ action: 'manualPush', data: gameDataToSend }, response => {
      if (response && response.success) {
        statusText.textContent = 'Successfully Sent';
      } else {
        statusText.textContent = 'Error Sending';
      }
    });
  });

  initStaticFields();
  checkSavedUrl();
  populatePlayerSelect();
  playerSelect.setAttribute('data-prev', playerSelect.value || '1');
  renderPlayerFields(parseInt(playerSelect.value) || 1);
});
