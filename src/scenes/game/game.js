const Scene = require('telegraf/scenes/base');
const GameManager = require('./GameManager');
const { States } = require('./states');

let gameManager = null;

const game = new Scene('game');
game.enter(async (ctx) => {
    gameManager = new GameManager(ctx)
    ctx.game.gameManager = gameManager;

    await ctx.reply('The game has begun!');
    await gameManager.switchState(States.BET);
});

module.exports = game;