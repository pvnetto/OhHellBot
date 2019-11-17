const GameManager = require('../game/managers/game');
const BetManager = require('../game/managers/bets');
const RoundManager = require('../game/managers/round');
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
    let betManager, roundManager;
    beforeEach(async () => {
        await ctx.session.game.gameManager.distributeCards(ctx);
        ctx.session.game.betManager = new BetManager(ctx);
        ctx.session.game.roundManager = new RoundManager(ctx);

        betManager = ctx.session.game.betManager;
        roundManager = ctx.session.game.roundManager;

        for (let i = 0; i < betManager.players; i++) {
            betManager.placeBet(betManager.players[i], 0, ctx);
        }
    });

    test("auto plays the first round", async () => {
        expect(roundManager.isRoundOver).toBeFalsy();
        await roundManager.startTurn(ctx);
        expect(roundManager.isRoundOver).toBeTruthy();
    });

    // Easier to test on the first turn than second
    test("winner of the round is the first to play next turn", async () => {
        await roundManager.startTurn(ctx);
        const roundScores = roundManager.roundScores;
        const roundWinnerId = Object.keys(roundManager.roundScores).find(playerId => roundScores[playerId] === 1);
        const roundWinner = roundManager.players.find(player => player.id == roundWinnerId);

        expect(roundManager.players[0]).toEqual(roundWinner);
    });
})

describe("from second round onwards", () => {
    let betManager, roundManager;
    beforeEach(async () => {
        ctx.session.game.gameManager.handleNextRound();
        await ctx.session.game.gameManager.distributeCards(ctx);

        ctx.session.game.betManager = new BetManager(ctx);
        ctx.session.game.roundManager = new RoundManager(ctx);

        betManager = ctx.session.game.betManager;
        roundManager = ctx.session.game.roundManager;

        for (let i = 0; i < betManager.players; i++) {
            betManager.placeBet(betManager.players[i], 0, ctx);
        }
    });

    test("auto plays when each player has only 1 card left", async () => {
        await roundManager.startTurn(ctx);
        expect(roundManager.isRoundOver).toBeFalsy();

        let roundPlayers = roundManager.players;
        for (let i = 0; i < roundPlayers.length; i++) {
            await roundManager.placeCard(roundPlayers[i], 0, ctx);
        }

        expect(roundManager.isRoundOver).toBeTruthy();
    });

    test("players can only play when it's their turn", async () => {
        await roundManager.startTurn(ctx);

        let roundPlayers = roundManager.players;

        for (const [i, player] of roundPlayers.entries()) {
            for (const [j, otherPlayer] of roundPlayers.entries()) {
                if (player == otherPlayer) continue;

                await roundManager.placeCard(otherPlayer, 0, ctx);
                expect(roundManager.turnPlayerIdx).toBe(i);
                expect(roundManager.isRoundOver).toBeFalsy();
            }

            await roundManager.placeCard(player, 0, ctx);
            expect(roundManager.turnPlayerIdx).toBe(i + 1);
        }
    });

    test("users that are not in the match can't play cards", async () => {
        await roundManager.startTurn(ctx);

        const userNotInMatch = { id: 43242, first_name: 'Outsider' };
        await roundManager.placeCard(userNotInMatch, 0, ctx);

        expect(roundManager.turnPlayerIdx).toBe(0);
    });
});