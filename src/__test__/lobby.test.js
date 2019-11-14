const LobbyManager = require('../game/managers/lobby');

let mockReply;
let mockDb;
let mockScene;
let mockSession;

const mockUsers = [
    { id: 2, first_name: 'Paiva2', },
    { id: 3, first_name: 'Paiva3', },
    { id: 4, first_name: 'Paiva4', },
    { id: 5, first_name: 'Paiva5', },
    { id: 6, first_name: 'Paiva6', },
    { id: 7, first_name: 'Paiva7', },
];
const owner = { id: 1, first_name: 'Paiva1', };

let lobbyManager;

beforeEach(() => {
    mockReply = jest.fn();
    mockDb = {};
    mockScene = {
        enter: jest.fn(),
    };
    mockSession = { lobby: {} };

    lobbyManager = new LobbyManager(owner, { db: mockDb, reply: mockReply });
});

describe("add players to lobby", () => {
    test("adds owner when lobby is created", () => {
        expect(lobbyManager.players).toContain(owner);
        expect(mockDb[owner.id]).toBeDefined();
    });

    test("adds player when it's not in the lobby", () => {
        const player = mockUsers[1];
        lobbyManager.addPlayer(player, { db: mockDb, reply: mockReply });

        expect(lobbyManager.players).toContain(player);
        expect(mockDb[player.id]).toBeDefined();
    });

    test("doesn't add player when it's already in the lobby", () => {
        lobbyManager.addPlayer(owner, { db: mockDb, reply: mockReply });
        expect(lobbyManager.players.length).toBe(1);
    });

    test("can't add more players than max capacity", () => {
        mockUsers.forEach(user => {
            lobbyManager.addPlayer(user, { db: mockDb, reply: mockReply });
        });

        const lastUser = { id: 99, first_name: 'the last user' };
        lobbyManager.addPlayer(lastUser, { db: mockDb, reply: mockReply });

        expect(lobbyManager).not.toContain(lastUser);
    });

    test("doesn't add player when it's in another lobby", () => {
        const player = mockUsers[1];
        mockDb[player.id] = {};
        lobbyManager.addPlayer(player, { db: mockDb, reply: mockReply });

        expect(mockDb[player.id]).toBeDefined();
        expect(lobbyManager.players).not.toContain(player);
    });
});

describe("remove players from lobby", () => {
    test("removes player properly", () => {
        lobbyManager.removePlayer(owner, { db: mockDb, reply: mockReply });
        expect(mockDb[owner.id]).toBeUndefined();
        expect(lobbyManager.players).not.toContain(owner);
    });

    test("removed player can join the lobby again", () => {
        const player = mockUsers[1];
        lobbyManager.addPlayer(player, { db: mockDb, reply: mockReply });
        lobbyManager.removePlayer(player, { db: mockDb, reply: mockReply });
        expect(lobbyManager.players).not.toContain(player);

        lobbyManager.addPlayer(player, { db: mockDb, reply: mockReply });
        expect(lobbyManager.players).toContain(player);
    });
})

describe("start match", () => {
    test("can't start match with less than min players", () => {
        lobbyManager.startMatch({ scene: mockScene, session: mockSession, reply: mockReply });
        expect(mockScene.enter).not.toBeCalled();
    });

    test("begins game properly when enough players", () => {
        const player = mockUsers[1];
        lobbyManager.addPlayer(player, { db: mockDb, reply: mockReply });
        lobbyManager.startMatch({ scene: mockScene, session: mockSession, reply: mockReply });
        expect(mockScene.enter).toBeCalledWith('game');
    });
})