const Scene = require('telegraf/scenes/base');
const LobbyManager = require('./LobbyManager');

// Lobby assumes the user is in a group
let lobbyManager = null;

const lobby = new Scene('lobby');
lobby.enter((ctx) => lobbyManager = new LobbyManager(ctx));
lobby.help((ctx) => ctx.reply('/join: Joins the match.\n/leave: Leaves the match.\n/start: Starts the match.'));

lobby.command('new', ({ reply }) => reply(`There's already an active lobby!`));

lobby.command('join', ({ from, telegram, reply }) => lobbyManager.addPlayer(from, { telegram, reply }));
lobby.action(/join/, ({ from, telegram, reply }) => lobbyManager.addPlayer(from, { telegram, reply }));

lobby.command('leave', ({ from, reply }) => lobbyManager.removePlayer(from, { reply }));
lobby.command('list', (ctx) => lobbyManager.listPlayers(ctx));
lobby.command('start', (ctx) => lobbyManager.startMatch(ctx));
lobby.command('close', ({ from, reply }) => console.log("Closing the lobby"));

module.exports = lobby;