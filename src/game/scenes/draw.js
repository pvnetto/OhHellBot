const Scene = require('telegraf/scenes/base');
const { States } = require('../managers/game/states');

const draw = new Scene('draw');

draw.enter(async ({ stickerManager, session, telegram }) => {
    await session.game.gameManager.distributeCards({ stickerManager, session, telegram });
    await session.game.gameManager.switchState(States.BET);
});

module.exports = draw;