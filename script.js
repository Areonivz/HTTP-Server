// State Management
let currentGame = null;
let currentPlayer = null;
let currentMode = 'shooter';
let selectedZone = null;
let players = [];
let data = {};

// Zone names mapping
const zoneNames = {
    1: 'Top Left',
    2: 'Top Center',
    3: 'Top Right',
    4: 'Mid Left',
    5: 'Crease',
    6: 'Mid Right',
    7: 'Low Left',
    8: 'Low Center',
    9: 'Low Right',
    10: 'Behind (X)'
};

// Sample squad data
const sampleSquadData = `Name,Second Name,Grouping,Position,Bib Number
Torz,Anderson,Podium Potential,Outfield,1
Habi,Littlehales,Development,Outfield,1
Charlie,Bell,Development,Outfield,3
Cece,Green,Podium,Outfield,3
Anna,Neville,Podium Potential,Outfield,4
Emma,Oakley,Podium,Outfield,6
Lucy,Devine,Podium Potential,Outfield,7
Georgie,Greenwood,Podium Potential,Outfield,8
Hannah,Whiteley,Podium Potential,Outfield,10
Freya,Moody,Development,Outfield,12
Claire,Faram,Podium,Outfield,13
Alice,Ripper,Podium Potential,Outfield,13
Minty,Loxton,Podium,Outfield,14
Lauren,Hart,Podium,Outfield,15
Lizzie,Rutherford,Podium Potential,Outfield,16
Sophy,Coombes-Roberts,Podium Potential,Outfield,17
Lottie,Robertson,Podium RTP,Outfield,17
Kai,Harper,Development,Outfield,18
Nina,Sherwen,Development,Outfield,19
Julie,Wise,Podium,Outfield,20
Carys,Johnson,Development,Outfield,22
Rachael,Ball,Podium Potential,Outfield,23
Annie,Mather,Podium Potential,Outfield,25
Millie,Hughes,Development,Outfield,27
Ella,Cohen,Podium Potential,Outfield,28
Jemma,Thomson,Development,Outfield,29
Chess,Gray,Podium,Outfield,30
Emma,Savage,Podium,Outfield,31
Zoe,Dickson,Podium,Outfield,32
Harriet,Brookes,Development,GK,34
Ella,Malik,Podium Potential,Outfield,35
Ellie,Martin,Development,,36
Ellie,Jones,Podium Potential,Outfield,38
Anna,Saunter,Podium,Outfield,39
Sofia,Wise,Podium,Outfield,40
Emilie,Chandler,Podium Potential,Goalie,No bib
Izzy,Middleton,Development,Goalie,No bib
Livy,Schellekens,Podium Potential,Goalie,No bib
Dylan,Whittington,Podium,Goalie,No bib
Sienna,Parekh,Podium Potential,Goalie,No bib
Britt,Read,Overseas,Goalie,No bib
Emma,Pearce,Development,,
Teagan,Scott,Overseas,,
Jordan,Carr,Overseas,,
Emily,Nalls,Overseas,,
Dillyn,Patten,Overseas,`;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updatePlayerList();
});

// Data Management
function loadData() {
    const saved = localStorage.getItem('lacrosseStats');
    if (saved) {
        data = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem('lacrosseStats', JSON.stringify(data));
}

// Load Sample Data
function loadSampleData() {
    parseCSV(sampleSquadData);
    showNotification('Sample squad data loaded!');
}

// CSV Upload Handler
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
}

// JSON Upload Handler
function handleJSONUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Merge imported data with existing data
            if (importedData.games) {
                data = { ...data, ...importedData.games };
            }
            
            // Import players if available
            if (importedData.players) {
                players = importedData.players;
            }
            
            saveData();
            updatePlayerList();
            updateZoneStats();
            showNotification('Session data imported successfully!');
        } catch (error) {
            console.error('Error importing JSON:', error);
            showNotification('Error importing file: Invalid JSON format', 'error');
        }
    };
    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    players = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 2) {
            const firstName = parts[0]?.trim() || '';
            const secondName = parts[1]?.trim() || '';
            const grouping = parts[2]?.trim() || '';
            const position = parts[3]?.trim() || 'Outfield';
            let bibNumber = parts[4]?.trim() || '';
            
            if (firstName && secondName) {
                const fullName = `${firstName} ${secondName}`;
                const isGK = position.toLowerCase().includes('gk') || position.toLowerCase().includes('goalie');
                
                players.push({
                    id: `player_${Date.now()}_${i}`,
                    firstName: firstName,
                    lastName: secondName,
                    name: fullName,
                    grouping: grouping,
                    position: isGK ? 'Goalkeeper' : 'Outfield',
                    bibNumber: bibNumber,
                    isGoalkeeper: isGK
                });
            }
        }
    }

    players.sort((a, b) => {
        const aNum = parseInt(a.bibNumber);
        const bNum = parseInt(b.bibNumber);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        return aNum - bNum;
    });

    showNotification(`Loaded ${players.length} players`);
    updatePlayerList();
}

// Game Session Management
function createGameSession() {
    const hudlLink = document.getElementById('hudlLink').value.trim();
    if (!hudlLink) {
        showNotification('Please enter a Hudl game link', 'error');
        return;
    }

    currentGame = hudlLink;
    
    if (!data[currentGame]) {
        data[currentGame] = {
            players: {},
            goalkeepers: {}
        };
    }

    document.getElementById('currentGameDisplay').textContent = `Game: ${hudlLink.substring(0, 50)}${hudlLink.length > 50 ? '...' : ''}`;
    saveData();
    showNotification('Game session created!');
}

// Player Selection
function selectPlayer(playerId) {
    currentPlayer = playerId;
    const player = players.find(p => p.id === playerId);
    
    document.querySelectorAll('.player-item').forEach(item => {
        item.classList.remove('active');
    });
    const playerElement = document.getElementById(`player_${playerId}`);
    if (playerElement) {
        playerElement.classList.add('active');
    }
    
    if (player) {
        document.getElementById('currentPlayerDisplay').innerHTML = `
            <div class="player-bib-large">${player.bibNumber && player.bibNumber !== 'No bib' ? player.bibNumber : 'NB'}</div>
            <div>
                <div>${player.name}</div>
                <div style="font-size: 0.85rem; color: #a0a0a0;">${player.position}</div>
            </div>
        `;
    }

    if (!data[currentGame]) {
        data[currentGame] = { players: {}, goalkeepers: {} };
    }

    if (currentMode === 'shooter') {
        if (!data[currentGame].players[playerId]) {
            data[currentGame].players[playerId] = {
                name: player.name,
                number: player.bibNumber,
                zones: {}
            };
            for (let i = 1; i <= 10; i++) {
                data[currentGame].players[playerId].zones[i] = { goals: 0, misses: 0 };
            }
        }
    } else {
        if (!data[currentGame].goalkeepers[playerId]) {
            data[currentGame].goalkeepers[playerId] = {
                name: player.name,
                number: player.bibNumber,
                zones: {}
            };
            for (let i = 1; i <= 10; i++) {
                data[currentGame].goalkeepers[playerId].zones[i] = { saves: 0, conceded: 0, concededLast5s: 0 };
            }
        }
    }

    updateZoneStats();
    saveData();
}

// Mode Toggle
function setMode(mode) {
    currentMode = mode;
    selectedZone = null;
    
    document.getElementById('shooterMode').classList.toggle('active', mode === 'shooter');
    document.getElementById('gkMode').classList.toggle('active', mode === 'goalkeeper');
    
    document.getElementById('shooterControls').classList.toggle('hidden', mode !== 'shooter');
    document.getElementById('gkControls').classList.toggle('hidden', mode !== 'goalkeeper');
    
    document.querySelectorAll('.zone').forEach(z => {
        z.classList.remove('selected');
        z.style.opacity = '0.6';
    });
    
    updateZoneIndicator();
    updatePlayerList();
    updateZoneStats();
}

// Update Zone Indicator
function updateZoneIndicator() {
    if (currentMode === 'shooter') {
        const indicator = document.getElementById('shooterZoneIndicator');
        if (selectedZone) {
            indicator.textContent = `Selected Zone: ${zoneNames[selectedZone]}`;
            indicator.style.color = '#00d26a';
        } else {
            indicator.textContent = 'Select a zone on the field';
            indicator.style.color = '#e94560';
        }
    } else {
        const indicator = document.getElementById('gkZoneIndicator');
        if (selectedZone) {
            indicator.textContent = `Selected Zone: ${zoneNames[selectedZone]}`;
            indicator.style.color = '#00d26a';
        } else {
            indicator.textContent = 'Select a zone on the field';
            indicator.style.color = '#e94560';
        }
    }
}

// Zone Click Handler
function handleZoneClick(zoneId) {
    if (!currentGame) {
        showNotification('Please create a game session first', 'error');
        return;
    }
    if (!currentPlayer) {
        showNotification('Please select a player', 'error');
        return;
    }

    selectedZone = zoneId;
    
    document.querySelectorAll('.zone').forEach(z => {
        z.classList.remove('selected');
        z.style.opacity = '0.6';
    });
    
    const zoneElement = document.getElementById(`zone${zoneId}`);
    zoneElement.classList.add('selected');
    zoneElement.style.opacity = '1';
    
    updateZoneIndicator();
    showNotification(`Zone selected: ${zoneNames[zoneId]}`);
}

// Record Shot
function recordShot(type) {
    if (!currentGame || !currentPlayer || !selectedZone) {
        showNotification('Select a game, player, and zone first', 'error');
        return;
    }

    const playerData = data[currentGame].players[currentPlayer];
    if (!playerData || !playerData.zones) {
        showNotification('Player data not initialized', 'error');
        return;
    }
    
    const zoneData = playerData.zones[selectedZone];
    if (!zoneData) {
        zoneData = { goals: 0, misses: 0 };
        playerData.zones[selectedZone] = zoneData;
    }
    
    if (type === 'goal') {
        zoneData.goals++;
        showNotification(`Goal in ${zoneNames[selectedZone]}! ⚽`);
    } else {
        zoneData.misses++;
        showNotification(`Miss/Saved in ${zoneNames[selectedZone]} ❌`);
    }

    updateZoneStats();
    updatePlayerList();
    saveData();
}

// Record GK Stats
function recordGKStat(type) {
    if (!currentGame || !currentPlayer || !selectedZone) {
        showNotification('Select a game, goalkeeper, and zone first', 'error');
        return;
    }

    const gkData = data[currentGame].goalkeepers[currentPlayer];
    if (!gkData || !gkData.zones) {
        showNotification('Goalkeeper data not initialized', 'error');
        return;
    }
    
    const zoneData = gkData.zones[selectedZone];
    if (!zoneData) {
        zoneData = { saves: 0, conceded: 0, concededLast5s: 0 };
        gkData.zones[selectedZone] = zoneData;
    }
    
    const last5Seconds = document.getElementById('gkLast5Seconds').checked;

    if (type === 'save') {
        zoneData.saves++;
        showNotification(`Save in ${zoneNames[selectedZone]}! 🧤`);
    } else {
        zoneData.conceded++;
        if (last5Seconds) {
            zoneData.concededLast5s++;
            showNotification(`Goal conceded in ${zoneNames[selectedZone]} (Last 5s) 🥅️`);
        } else {
            showNotification(`Goal conceded in ${zoneNames[selectedZone]} 🥅`);
        }
    }

    updateZoneStats();
    updatePlayerList();
    saveData();
}

// Calculate and Update Stats
function updateZoneStats() {
    // Reset all zone stats display
    for (let i = 1; i <= 10; i++) {
        document.getElementById(`stats${i}`).textContent = '0%';
    }

    if (!currentPlayer || !currentGame) return;

    if (currentMode === 'shooter' && data[currentGame].players[currentPlayer]) {
        const playerData = data[currentGame].players[currentPlayer];
        
        for (let i = 1; i <= 10; i++) {
            const zoneData = playerData.zones[i];
            if (zoneData) {
                const total = (zoneData.goals || 0) + (zoneData.misses || 0);
                const percentage = total > 0 ? (((zoneData.goals || 0) / total) * 100).toFixed(1) : 0;
                document.getElementById(`stats${i}`).textContent = `${percentage}% (${zoneData.goals || 0}/${total})`;
            }
        }
    } else if (currentMode === 'goalkeeper' && data[currentGame].goalkeepers[currentPlayer]) {
        const gkData = data[currentGame].goalkeepers[currentPlayer];
        
        for (let i = 1; i <= 10; i++) {
            const zoneData = gkData.zones[i];
            if (zoneData) {
                const total = (zoneData.saves || 0) + (zoneData.conceded || 0);
                const savePct = total > 0 ? (((zoneData.saves || 0) / total) * 100).toFixed(1) : 0;
                document.getElementById(`stats${i}`).textContent = `${savePct}% (${zoneData.saves || 0}/${total})`;
            }
        }
    }
}

// Update Player List UI
function updatePlayerList() {
    const list = document.getElementById('playerList');
    const positionFilter = document.getElementById('positionFilter').value;
    
    if (players.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">Upload CSV or load sample data</div>';
        return;
    }

    let displayPlayers = players.filter(p => {
        if (positionFilter === 'outfield') {
            return !p.isGoalkeeper;
        } else if (positionFilter === 'goalkeeper') {
            return p.isGoalkeeper;
        }
        return true;
    });

    if (displayPlayers.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: #666; padding: 40px;">
            No players match the current filters
        </div>`;
        return;
    }

    list.innerHTML = '';
    
    displayPlayers.forEach(player => {
        const div = document.createElement('div');
        div.className = `player-item ${currentPlayer === player.id ? 'active' : ''}`;
        div.id = `player_${player.id}`;
        div.onclick = () => selectPlayer(player.id);

        const bibDisplay = player.bibNumber && player.bibNumber !== 'No bib' ? player.bibNumber : 'NB';
        const bibClass = player.bibNumber && player.bibNumber !== 'No bib' ? '' : 'no-bib';

        let statsText = '';
        if (currentGame) {
            if (currentMode === 'shooter' && data[currentGame].players[player.id]) {
                const pData = data[currentGame].players[player.id];
                const totalGoals = Object.values(pData.zones || {}).reduce((sum, z) => sum + (z.goals || 0), 0);
                const totalShots = Object.values(pData.zones || {}).reduce((sum, z) => sum + (z.goals || 0) + (z.misses || 0), 0);
                const pct = totalShots > 0 ? ((totalGoals / totalShots) * 100).toFixed(1) : 0;
                statsText = `<div class="player-stats-summary">${totalGoals}/${totalShots} shots (${pct}%)</div>`;
            } else if (currentMode === 'goalkeeper' && data[currentGame].goalkeepers[player.id]) {
                const gkData = data[currentGame].goalkeepers[player.id];
                const totalSaves = Object.values(gkData.zones || {}).reduce((sum, z) => sum + (z.saves || 0), 0);
                const totalConceded = Object.values(gkData.zones || {}).reduce((sum, z) => sum + (z.conceded || 0), 0);
                const total = totalSaves + totalConceded;
                const savePct = total > 0 ? ((totalSaves / total) * 100).toFixed(1) : 0;
                statsText = `<div class="player-stats-summary">${totalSaves} saves, ${totalConceded} conceded (${savePct}%)</div>`;
            }
        }

        div.innerHTML = `
            <div class="player-bib ${bibClass}">${bibDisplay}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-details">
                    <span class="player-position">${player.position}</span>
                </div>
                ${statsText}
            </div>
        `;

        list.appendChild(div);
    });
}

// Export Data
function exportData() {
    const exportObj = {
        exportDate: new Date().toISOString(),
        players: players,
        games: data
    };

    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lacrosse_stats_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Data exported successfully!');
}

// Clear All Data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.removeItem('lacrosseStats');
        data = {};
        currentGame = null;
        currentPlayer = null;
        selectedZone = null;
        document.getElementById('currentGameDisplay').textContent = 'No Game Selected';
        document.getElementById('currentPlayerDisplay').textContent = 'No Player Selected';
        updatePlayerList();
        updateZoneStats();
        updateZoneIndicator();
        showNotification('All data cleared');
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.style.background = type === 'error' ? '#ff4757' : '#00d26a';
    notif.style.display = 'block';
    
    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        if (currentMode === 'shooter') recordShot('goal');
        else recordGKStat('save');
    } else if (e.key === 'm' || e.key === 'M') {
        if (currentMode === 'shooter') recordShot('miss');
        else recordGKStat('conceded');
    }
});