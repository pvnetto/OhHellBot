const { evaluateCards } = require('../game/cards/evaluator');
const CardsDeck = require('../game/cards/deck');

test('always evaluates trump as biggest', () => {
    const deck = new CardsDeck();
    for (let i = 0; i < deck.maxDeckSize; i++) {
        const trumpCard = deck.drawCardByIndex(i);

        while (deck.numOfCardsLeft > 0) {
            const cardToEvaluate = deck.drawCardByIndex(0);
            const winnerCard = evaluateCards([cardToEvaluate, trumpCard], trumpCard);

            if (cardToEvaluate.rank !== trumpCard.rank) {
                expect(winnerCard).toEqual(trumpCard);
            }
        }

        deck.reset();
    }
});

test('no winners when all are spoiled', () => {

});