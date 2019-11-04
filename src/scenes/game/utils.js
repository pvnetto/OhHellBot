exports.reorderPlayers = function (players, firstToPlay) {
    if (firstToPlay) {
        // Reordering players
        const winnerIdx = players.findIndex(player => player.id == firstToPlay.id);
        const removed = players.splice(winnerIdx, Number.MAX_VALUE);
        players = [...removed, ...players];
    }

    return players;
}