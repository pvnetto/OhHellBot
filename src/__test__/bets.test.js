const GameManager = require('../game/managers/game');
const BetManager = require('../game/managers/bets');

const mockUsers = [
    { id: 1, first_name: 'Paiva1', },
    { id: 2, first_name: 'Paiva2', },
    { id: 3, first_name: 'Paiva3', },
    { id: 4, first_name: 'Paiva4', },
    { id: 5, first_name: 'Paiva5', },
    { id: 6, first_name: 'Paiva6', },
    { id: 7, first_name: 'Paiva7', },
];

let mockDb;
let mockSession;
let mockScene;
let mockTelegram;
let mockReply;
let ctx;

beforeEach(() => {
    mockReply = jest.fn();
    mockDb = {};

    mockScene = {
        enter: jest.fn(),
    };

    mockSession = {
        game: {},
        lobby: {
            groupId: 3124123,
            players: [...mockUsers]
        }
    };

    mockTelegram = {
        sendMessage: jest.fn()
    };

    mockUsers.forEach(user => mockDb[user.id] = {});
    ctx = { reply: mockReply, db: mockDb, scene: mockScene, session: mockSession, telegram: mockTelegram };
    mockSession.game.gameManager = new GameManager({ db: mockDb, session: mockSession, scene: mockScene });
});

describe("bet order", () => {
    test("on first round, current dealer is the first to bet", () => {
        const betManager = new BetManager(ctx);
        expect(betManager.players[0]).toEqual(mockUsers[0]);
    });

    test("on every other round, next dealer is the first to bet, current dealer is the last", () => {
        const gameManager = ctx.session.game.gameManager;

        for (let i = 0; i < 20; i++) {
            gameManager.handleNextRound();

            const currentDealer = gameManager.players[0];
            const nextDealer = gameManager.players[1];

            const betManager = new BetManager(ctx);
            expect(betManager.players[0]).toEqual(nextDealer);
            expect(betManager.players[betManager.players.length - 1]).toEqual(currentDealer);
        }
    });
});

describe("players are forced to obey bet rules", () => {

    let betManager;
    let betPlayers;

    beforeEach(() => {
        betManager = new BetManager(ctx);
        betPlayers = betManager.players;
    });

    describe("on first round", () => {
        test("last player can place any bet", () => {
            for (let i = 0; i < betPlayers.length; i++) {
                // Last player tries to place a bet of 2, to make the sum equal the number of drawn cards
                if (i === betPlayers.length - 1) {
                    betManager.placeBet(betPlayers[i], 1, ctx);
                    expect(betManager.bets[betPlayers[i].id]).toBe(1);
                }
                else {
                    betManager.placeBet(betPlayers[i], 0, ctx);
                }

                expect(betManager.currentPlayerIdx).toBe(i + 1);
            }
        });
    });

    describe("on second round and beyond", () => {
        beforeEach(() => {
            // Testing on second round
            ctx.session.game.gameManager.handleNextRound();
            betManager = new BetManager(ctx);
            betPlayers = betManager.players;
        });

        test("last player can't place a bet that makes the bet sum equal the number of drawn cards", () => {
            for (let i = 0; i < betPlayers.length; i++) {
                // Last player tries to place a bet of 2, to make the sum equal the number of drawn cards
                if (i === betPlayers.length - 1) {
                    betManager.placeBet(betPlayers[i], 2, ctx);
                    expect(betManager.currentPlayerIdx).toBe(i);

                    const replyCalls = mockReply.mock.calls;
                    expect(replyCalls[replyCalls.length - 1][0]).toMatch('Invalid bet value');
                }
                else {
                    betManager.placeBet(betPlayers[i], 0, ctx);
                    expect(betManager.currentPlayerIdx).toBe(i + 1);
                }
            }

        });
    });

    describe("on any round", () => {
        test("players can only bet on their turn", () => {
            for (let i = 0; i < betPlayers.length; i++) {
                for (let j = 0; j < betPlayers.length; j++) {
                    if (i != j) {
                        betManager.placeBet(betPlayers[j], 0, ctx);
                        const replyCalls = mockReply.mock.calls;
                        expect(replyCalls[replyCalls.length - 1][0]).toMatch('not your turn');
                    }
                    expect(betManager.currentPlayerIdx).toBe(i);
                }
                betManager.placeBet(betPlayers[i], 0, ctx);
                expect(betManager.currentPlayerIdx).toBe(i + 1);
            }

            expect(betManager.currentPlayerIdx).toBe(betPlayers.length);
        });

        test("players from outside the lobby can't place bets", () => {
            betManager.placeBet({ id: 43242, first_name: 'Outsider' }, 0, ctx);
            expect(betManager.currentPlayerIdx).toBe(0);

        });
    });

});