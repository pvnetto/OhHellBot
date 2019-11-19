function mockStickerManager() {
    return {
        getStickerByCard: jest.fn(() => 0),
    };
}

function mockScene() {
    return {
        enter: jest.fn(),
    };
}

function mockTelegram() {
    return {
        sendMessage: jest.fn(),
        sendSticker: jest.fn(),
    };
}

function mockReply() {
    return jest.fn();
}

function mockPreLobbySession() {
    return { lobby: {} };
}

function mockPostLobbySession(users) {
    return {
        ...mockPreLobbySession(),
        game: {},
        lobby: {
            groupId: 421413,
            players: [...users],
        }
    };
}

exports.mockPreLobbySession = mockPreLobbySession;
exports.mockPostLobbySession = mockPostLobbySession;

exports.mockContext = function (users = []) {
    const db = users.reduce((currentDb, user) => {
        currentDb[user.id] = {};
        return currentDb;
    }, {});

    return {
        from: { id: 9991234, first_name: "Frommskie" },
        stickerManager: mockStickerManager(),
        db,
        session: {},
        scene: mockScene(),
        telegram: mockTelegram(),
        reply: mockReply(),
    }
}