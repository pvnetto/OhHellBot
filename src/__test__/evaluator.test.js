const { evaluateCards } = require('../game/cards/evaluator');
const { Ranks, Suits } = require('../game/cards/types');
const { Card } = require('../game/cards/card');
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

test('biggest trump always beats other trumps', () => {
    const biggestSuit = Object.keys(Suits).find(key => Suits[key] === Suits.CLUBS);

    Object.keys(Ranks).forEach(rank => {
        const biggestTrump = new Card(rank, biggestSuit);
        const trumps = Object.keys(Suits).map(suit => new Card(rank, suit));

        const winner = evaluateCards(trumps, trumps[0]);
        expect(winner).toEqual(biggestTrump);
    });
});

test('no winners when all are spoiled', () => {
    const trumpSuit = Object.keys(Suits).find(key => Suits[key] === Suits.CLUBS);
    let trumpRank = Object.keys(Ranks).find(key => Ranks[key] === Ranks.THREE);

    Object.keys(Ranks).forEach(rank => {
        const roundTrump = new Card(trumpRank, trumpSuit);
        const roundCards = Object.keys(Suits).map(suit => new Card(rank, suit));
        const roundWinner = evaluateCards(roundCards, roundTrump);
        expect(roundWinner).toBeNull();

        trumpRank = rank;
    });

});

test('smallest card wins when bigger cards are spoiled', () => {
    const cardRank = Object.keys(Ranks).find(rank => Ranks[rank] === Ranks.FOUR);
    const cardSuit = Object.keys(Suits).find(suit => Suits[suit] === Suits.CLUBS);
    const trumpRank = Object.keys(Ranks).find(rank => Ranks[rank] === Ranks.THREE);

    const smallestCard = new Card(cardRank, cardSuit);
    const trumpCard = new Card(trumpRank, cardSuit);

    // This test shouldn't evaluate the rank to be tested and the trump rank
    const ranksToEvaluate = Object.keys(Ranks).filter(rank => rank !== cardRank && rank !== trumpRank);
    ranksToEvaluate.forEach(rank => {
        const turnCards = Object.keys(Suits).map(suit => new Card(rank, suit));
        turnCards.push(smallestCard);

        const turnWinner = evaluateCards(turnCards, trumpCard);
        expect(turnWinner).toEqual(smallestCard);
    });

});

test('throws error when evaluating invalid card', () => {
    const deck = new CardsDeck();
    const trump = deck.drawCardByIndex(0);
    const cards = deck.drawCards(10);
    cards.push({ rank: 'this is a rank', suit: 'fake suit' });

    // When testing exceptions, the tested unit must be wrapped around an anonymous function
    expect(() => evaluateCards(cards, trump)).toThrow(TypeError);
});