const { Ranks, Suits } = require('./types');
const { card } = require('./card');

module.exports = class CardsDeck {

    constructor() {
        this.deck = _buildDeck();
        this.maxDeckSize = Object.keys(Ranks).length * Object.keys(Suits).length;
    }

    get numOfCardsLeft() { return this.deck.length; }

    // Assumes Ranks are ordered from 1 to biggest
    drawTrumpCard() {
        const drawnCard = this.deck.pop();
        const trumpRankValue = Ranks[drawnCard.rank] + 1;
        const trumpRank = Object.keys(Ranks).find((rank) => Ranks[rank] === trumpRankValue) ||
            Object.keys(Ranks).find((rank) => Ranks[rank] === Ranks.FOUR);

        return {
            drawn: drawnCard,
            trump: card(trumpRank, drawnCard.suit),
        };
    }

    drawCards(count) {
        let drawnCards = [];

        for (let i = 0; i < count; i++) {
            drawnCards.push(this.deck.pop());
        }

        return drawnCards;
    }

    drawCardByIndex(index) {
        const drawnCard = this.deck.splice(index, 1);
        return drawnCard;
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }

        return this.deck;
    }

    reset() {
        this.deck = _buildDeck();
    }
}

function _buildDeck() {
    let deck = [];
    Object.keys(Ranks).forEach(rank => {
        Object.keys(Suits).forEach(suit => {
            deck.push(card(rank, suit));
        });
    });
    return deck;
};

