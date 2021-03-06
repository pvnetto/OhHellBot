const Extra = require('telegraf/extra');

module.exports = class LobbyManager {
    constructor(owner, { db, reply }) {
        this.players = [];
        this.owner = owner;
        this.maxPlayers = 7;
        this.minPlayers = 2;

        // TODO: Move to ES6 and use arrow functions
        this._init.bind(this);
        this.addPlayer.bind(this);
        this.leaveLobby.bind(this);
        this.listPlayers.bind(this);
        this.startMatch.bind(this);
        this.closeLobby.bind(this);
        this._isPlayerInLobby.bind(this);
        this._isLobbyFull.bind(this);
        this._isMatchReady.bind(this);

        this._init({ db, reply });
    }

    _init({ db, reply }) {
        reply(`${this.owner.first_name} created a Fodinha match. Send /join to join the match or /start to start it.`, Extra.HTML().markup((m) => (
            m.inlineKeyboard([
                m.callbackButton('Join', 'join'),
            ])
        )));

        this.addPlayer(this.owner, { db, reply }, { showAlert: false });
    }

    addPlayer(newPlayer, { db, reply }, options = { showAlert: true }) {
        if (this._isLobbyFull()) {
            reply(`Sorry ${newPlayer.first_name}, this match is already full.`);
        }
        else if (this._isPlayerInLobby(newPlayer)) {
            reply(`${newPlayer.first_name} is already in this lobby.`)
        }
        else if (this._isPlayerInAnotherLobby(newPlayer, { db })) {
            reply(`${newPlayer.first_name} is already in another lobby.`)
        }
        else {
            this.players.push(newPlayer);
            db[newPlayer.id] = {};

            if (options.showAlert) {
                reply(`${newPlayer.first_name} joined the match!`);
                this.listPlayers({ reply });
            }
        }
    }

    async leaveLobby(lobbyPlayer, { db, reply }) {
        if (this._removePlayer(lobbyPlayer, { db })) {
            await reply(`${lobbyPlayer.first_name} left the lobby!`);
            this.listPlayers({ reply });
        }
    }

    _removePlayer(lobbyPlayer, { db }) {
        if (this._isPlayerInLobby(lobbyPlayer)) {
            let playerIdx = this.players.findIndex(player => player.id === lobbyPlayer.id);
            this.players.splice(playerIdx, 1);
            delete db[lobbyPlayer.id];
            return true;
        }
        return false;
    }

    listPlayers({ reply }) {
        if (this.players.length === 0) {
            reply('The lobby is empty.');
        }
        else {
            const numInLobby = this.players.length;
            let listedPlayers = `Players in lobby: ${numInLobby}/${this.maxPlayers}\n`;
            this.players.forEach((player, idx) => listedPlayers += `${idx} - ${player.first_name}\n`);
            reply(listedPlayers);
        }
    }

    startMatch({ scene, session, reply }) {
        if (this._isMatchReady()) {
            session.lobby.players = this.players;
            scene.enter('game');
        }
        else {
            reply(`You need at least ${this.minPlayers} players to start a match.`)
        }
    }

    async closeLobby({ from, scene, db, session, reply }) {
        session.lobby = {};
        session.game = {};

        while (this.players.length > 0) {
            this._removePlayer(this.players[0], { db });
        }

        await reply(`Lobby was closed by ${from.first_name}. Send /new to start a new lobby.`);
        await scene.enter('greeter');
    }

    _isPlayerInLobby(lobbyPlayer) {
        return this.players.findIndex(player => player.id === lobbyPlayer.id) != -1;
    }

    _isPlayerInAnotherLobby(lobbyPlayer, { db }) {
        return Object.keys(db).find(key => key == lobbyPlayer.id);
    }

    _isMatchReady() {
        return this.players.length >= this.minPlayers;
    }

    _isLobbyFull() {
        return this.players.length === this.maxPlayers;
    }
}