const Scene = require('telegraf/scenes/base');
const GameManager = require('./GameManager');
const { States } = require('./states');

const game = new Scene('game');

game.enter(async ({ session, scene, reply }) => {
    const gameManager = new GameManager({ session, scene })
    session.game.gameManager = gameManager;

    await reply('The game has begun!');
    await gameManager.switchState(States.BET);
});

module.exports = game;