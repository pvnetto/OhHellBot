const LobbyManager = require('../game/managers/lobby');
const users = require('./mock/users');
const { mockContext, mockPreLobbySession } = require('./mock/context');

const owner = users[0];
let ctx;

let lobbyManager;

beforeEach(() => {
    ctx = mockContext();
    ctx.session = mockPreLobbySession();

    lobbyManager = new LobbyManager(owner, ctx);
});

describe("add players to lobby", () => {
    test("adds owner when lobby is created", () => {
        expect(lobbyManager.players).toContain(owner);
        expect(ctx.db[owner.id]).toBeDefined();
    });

    test("adds player when it's not in the lobby", () => {
        const player = users[1];
        lobbyManager.addPlayer(player, ctx);

        expect(lobbyManager.players).toContain(player);
        expect(ctx.db[player.id]).toBeDefined();
    });

    test("doesn't add player when it's already in the lobby", () => {
        lobbyManager.addPlayer(owner, ctx);
        expect(lobbyManager.players.length).toBe(1);
    });

    test("can't add more players than max capacity", () => {
        users.forEach(user => {
            lobbyManager.addPlayer(user, ctx);
        });

        const lastUser = { id: 99, first_name: 'the last user' };
        lobbyManager.addPlayer(lastUser, ctx);

        expect(lobbyManager).not.toContain(lastUser);
    });

    test("doesn't add player when it's in another lobby", () => {
        const player = users[1];
        ctx.db[player.id] = {};
        lobbyManager.addPlayer(player, ctx);

        expect(ctx.db[player.id]).toBeDefined();
        expect(lobbyManager.players).not.toContain(player);
    });
});

describe("remove players from lobby", () => {
    test("removes player properly", () => {
        lobbyManager.removePlayer(owner, ctx);
        expect(ctx.db[owner.id]).toBeUndefined();
        expect(lobbyManager.players).not.toContain(owner);
    });

    test("removed player can join the lobby again", () => {
        const player = users[1];
        lobbyManager.addPlayer(player, ctx);
        lobbyManager.removePlayer(player, ctx);
        expect(lobbyManager.players).not.toContain(player);

        lobbyManager.addPlayer(player, ctx);
        expect(lobbyManager.players).toContain(player);
    });
})

describe("start match", () => {
    test("can't start match with less than min players", () => {
        lobbyManager.startMatch(ctx);
        expect(ctx.scene.enter).not.toBeCalled();
    });

    test("begins game properly when enough players", () => {
        const player = users[1];
        lobbyManager.addPlayer(player, ctx);
        lobbyManager.startMatch(ctx);
        expect(ctx.scene.enter).toBeCalledWith('game');
    });
})