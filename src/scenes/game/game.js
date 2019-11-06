const Scene = require('telegraf/scenes/base');
const GameManager = require('./GameManager');

let gameManager = null;

const game = new Scene('game');
game.enter(async (ctx) => {
    gameManager = new GameManager(ctx)

    await ctx.reply('The game has begun!');
    ctx.game.gameManager = gameManager;
    ctx.scene.enter('bets');
});

module.exports = game;