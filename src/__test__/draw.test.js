const DrawManager = require('../game/managers/draw');
const CardsDeck = require('../game/cards/deck');

const users = require('./mock/users');
const { mockContext } = require('./mock/context');

let ctx;
let drawManager;

beforeEach(() => {
    ctx = mockContext();

    session = {
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
    for (let i = 2; i <= users.length; i++) {
        const players = users.slice(0, i);
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