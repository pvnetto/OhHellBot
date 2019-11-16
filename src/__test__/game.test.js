const GameManager = require('../game/managers/game');

const mockUsers = [
    { id: 1, first_name: 'Paiva1', },
    { id: 2, first_name: 'Paiva2', },
    { id: 3, first_name: 'Paiva3', },
    { id: 4, first_name: 'Paiva4', },
    { id: 5, first_name: 'Paiva5', },
    { id: 6, first_name: 'Paiva6', },
    { id: 7, first_name: 'Paiva7', },
];

let mockReply;
let mockDb;
let mockScene;
let mockSession;
let ctx;

let gameManager;

beforeEach(() => {
    mockReply = jest.fn();
    mockDb = {};

    mockScene = {
        enter: jest.fn(),
    };

    mockSession = {
        lobby: {
            groupId: 3124123,
            players: [...mockUsers]
        }
    };

    mockTelegram = {
        sendMessage: jest.fn()
    };

    mockUsers.forEach(user => mockDb[user.id] = {});
    gameManager = new GameManager({ db: mockDb, session: mockSession, scene: mockScene });
    ctx = { reply: mockReply, db: mockDb, scene: mockScene, session: mockSession, telegram: mockTelegram };
});

test("player is eliminated with 5 or more strikes", () => {
    // Eliminating all players
    for (let i = 0; i < mockUsers.length; i++) {
        expect(gameManager.players).toContain(mockUsers[i]);
        gameManager.handlePlayerStrikes(mockUsers[i], 10, 0);
        expect(gameManager.players).not.toContain(mockUsers[i]);
    }
});

test("game ends only when there's one or no players remaining", async () => {
    await gameManager.handleGameOver(ctx);
    expect(mockScene.enter).not.toBeCalled();

    // Eliminating all players, except for one
    for (let i = 1; i < mockUsers.length; i++) {
        gameManager.handlePlayerStrikes(mockUsers[i], 10, 0);
        expect(gameManager.players).not.toContain(mockUsers[i]);
    }

    await gameManager.handleGameOver(ctx);
    expect(mockScene.enter).toBeCalledWith('greeter');
});

test("player wins when no other players remain", async () => {
    // Eliminating all players, except for one
    for (let i = 1; i < mockUsers.length; i++) {
        gameManager.handlePlayerStrikes(mockUsers[i], 10, 0);
        expect(gameManager.players).not.toContain(mockUsers[i]);
    }

    await gameManager.handleGameOver(ctx);
    expect(mockTelegram.sendMessage).toBeCalled();
    expect(mockTelegram.sendMessage.mock.calls[0][1]).toMatch(`${mockUsers[0].first_name}`);
});

test("game draws when no player remains", async () => {
    // Eliminating all players
    for (let i = 0; i < mockUsers.length; i++) {
        gameManager.handlePlayerStrikes(mockUsers[i], 10, 0);
        expect(gameManager.players).not.toContain(mockUsers[i]);
    }

    await gameManager.handleGameOver(ctx);
    expect(mockTelegram.sendMessage).toBeCalled();
    expect(mockTelegram.sendMessage.mock.calls[0][1]).toMatch(`draw`);
});

test("game ends properly by setting sessions, db and scene", async () => {
    for (let i = 1; i < mockUsers.length; i++) {
        gameManager.handlePlayerStrikes(mockUsers[i], 10, 0);
    }

    await gameManager.handleGameOver(ctx);
    expect(mockScene.enter).toBeCalledWith('greeter');
    expect(mockDb).toEqual({});
    expect(mockSession.game).toEqual({});
    expect(mockSession.lobby).toEqual({});
});

test("players are reordered properly on round end", () => {
    for (let i = 0; i < gameManager.players.length * 2; i++) {
        const previousDealer = gameManager.players[0];
        const nextDealer = gameManager.players[1];
        gameManager.handleNextRound();

        const players = gameManager.players;
        expect(players[0]).toEqual(nextDealer);
        expect(players[players.length - 1]).toEqual(previousDealer);
    }
});