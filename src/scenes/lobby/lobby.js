const Scene = require('telegraf/scenes/base');
const LobbyManager = require('./LobbyManager');


const lobby = new Scene('lobby');

lobby.enter(({ db, session, from, reply }) => session.lobby.lobbyManager = new LobbyManager({ db, session, from, reply }));

lobby.help((ctx) => ctx.reply('/join: Joins the match.\n/leave: Leaves the match.\n/start: Starts the match.'));

lobby.command('new', ({ reply }) => reply(`There's already an active lobby!`));

lobby.command('join', ({ db, session, from, telegram, reply }) => session.lobby.lobbyManager.addPlayer(from, { db, telegram, reply }));
lobby.action(/join/, ({ session, from, telegram, reply }) => session.lobby.lobbyManager.addPlayer(from, { telegram, reply }));

lobby.command('leave', ({ db, session, from, reply }) => session.lobby.lobbyManager.removePlayer(from, { db, reply }));
lobby.command('list', ({ session, reply }) => session.lobby.lobbyManager.listPlayers({ reply }));
lobby.command('start', ({ scene, session }) => session.lobby.lobbyManager.startMatch({ scene, session }));
lobby.command('close', ({ from, reply }) => console.log("Closing the lobby"));

module.exports = lobby;