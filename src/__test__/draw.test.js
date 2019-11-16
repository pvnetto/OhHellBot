const DrawManager = require('../game/managers/draw');
const CardsDeck = require('../game/cards/deck');

const mockUsers = [
    { id: 1, first_name: 'Paiva1', },
    { id: 2, first_name: 'Paiva2', },
    { id: 3, first_name: 'Paiva3', },
    { id: 4, first_name: 'Paiva4', },
    { id: 5, first_name: 'Paiva5', },
    { id: 6, first_name: 'Paiva6', },
    { id: 7, first_name: 'Paiva7', },
];

let mockTelegram;
let mockStickerManager;
let mockSession;

let drawManager;

beforeEach(() => {
    mockTelegram = {
        sendMessage: jest.fn(),
        sendSticker: jest.fn(),
    };

    mockStickerManager = {
        getStickerByCard: jest.fn(() => 0),
    };

    mockSession = {
        lobby: {
            groupId: 3123123,
        }
    };
});

test("drawing too many cards from the deck throws an error", () => {
    let deck = new CardsDeck();
    expect(() => deck.drawCards(1000)).toThrow(RangeError);
})

test("cards to draw increments properly", async () => {
    const ctx = { stickerManager: mockStickerManager, session: mockSession, telegram: mockTelegram };

    for (let i = 2; i <= mockUsers.length; i++) {
        const players = mockUsers.slice(0, i);
        drawManager = new DrawManager(players);
        expect(players.length).toBe(i);

        for (let j = 0; j < 20; j++) {
            expect(() => drawManager.distributeCards(players, i, ctx)).not.toThrow(RangeError);
            Object.values(drawManager.hands).forEach((hand) => {
                expect(hand.length).toBe(drawManager.cardsToDraw)
            });
            drawManager.handleCardsToDrawIncrement();
        }
    }
});