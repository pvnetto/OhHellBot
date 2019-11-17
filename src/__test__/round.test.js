const GameManager = require('../game/managers/game');
const BetManager = require('../game/managers/bets');
const users = require('./mock/users');
const { mockContext, mockPostLobbySession } = require('./mock/context');

let ctx;

beforeEach(() => {
    ctx = mockContext(users);
    session = mockPostLobbySession(users);

    ctx = { ...ctx, session };
    ctx.session.game.gameManager = new GameManager(ctx);
});

describe("during first round", () => {
    test("auto plays when each player has only 1 card left", () => {

    });
})

describe("from second round onwards", () => {
    test("players can only play when it's their turn", () => {

    });

    test("users that are not in the match can't play cards", () => {

    });

    test("winner of the round is the first to play next round", () => {

    });
})

describe("on any round", () => {
    test("card is removed from player hand and added to turn cards when it's played", () => {

    });
});