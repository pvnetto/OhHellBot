const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

module.exports = class LobbyManager {
    constructor({ lobby, from, reply }) {
        this.players = [lobby.owner];
        this.owner = lobby.owner;
        this.maxPlayers = 7;
        this.minPlayers = 2;

        // TODO: Move to ES6 and use arrow functions
        this.addPlayer.bind(this);
        this.removePlayer.bind(this);
        this.listPlayers.bind(this);
        this.startMatch.bind(this);
        this._isPlayerInLobby.bind(this);
        this._isLobbyFull.bind(this);
        this._isMatchReady.bind(this);

        reply(`${from.first_name} created a Fodinha match. Send /join to join the match or /start to start it.`, Extra.HTML().markup((m) => (
            m.inlineKeyboard([
                m.callbackButton('Join', 'join'),
            ])
        )));
    }

    addPlayer(newPlayer, { telegram, reply }) {
        if (this._isLobbyFull()) {
            reply('This match is already full!');
        }
        else if (!this._isPlayerInLobby(newPlayer)) {
            this.players.push(newPlayer);
            reply(`${newPlayer.first_name} joined the match!`);
            telegram.sendMessage(newPlayer.id, "You just joined a game of Fodinha!");

            this.listPlayers({ reply });
        }
    }

    removePlayer(lobbyPlayer, { reply }) {
        if (this._isPlayerInLobby(lobbyPlayer)) {
            let playerIdx = this.players.findIndex(player => player.id === lobbyPlayer.id);
            this.players.splice(playerIdx, 1);

            reply(`${lobbyPlayer.first_name} left the lobby!`);
            this.listPlayers({ reply });
        }
    }

    listPlayers({ reply }) {
        if (this.players.length === 0) {
            reply('The lobby is empty.');
        }
        else {
            const numInLobby = players.length;
            let listedPlayers = `Players in lobby: ${numInLobby}/${this.maxPlayers}\n`;
            this.players.forEach((player, idx) => listedPlayers += `${idx} - ${player.first_name}\n`);
            reply(listedPlayers);
        }
    }

    startMatch(ctx) {
        if (this._isMatchReady()) {
            ctx.lobby.players = this.players;
            ctx.scene.enter('game');
        }
        else {
            ctx.reply(`You need at least ${this.minPlayers} players to start a match.`)
        }
    }

    _isPlayerInLobby(lobbyPlayer) {
        return this.players.findIndex(player => player.id === lobbyPlayer.id) != -1;
    }

    _isMatchReady() {
        return this.players.length >= this.minPlayers;
    }

    _isLobbyFull() {
        return this.players.length === this.maxPlayers;
    }
}