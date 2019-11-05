const { Ranks, Suits } = require('./types');

module.exports = class CardsDeck {

    constructor() {
        this.deck = this._buildDeck();
        this.maxDeckSize = Object.keys(Ranks).length * Object.keys(Suits).length;
    }

    _buildDeck() {
        let deck = [];
        Object.keys(Ranks).forEach(rank => {
            Object.keys(Suits).forEach(suit => {
                deck.push({ rank, suit });
            });
        });
        return deck;
    };

    // Assumes Ranks are ordered from 1 to biggest
    drawTrumpCard() {
        const drawnCard = this.deck.pop();
        const trumpRankValue = Ranks[drawnCard.rank] + 1;
        const trumpRank = Object.keys(Ranks).find((rank) => Ranks[rank] === trumpRankValue) ||
            Object.keys(Ranks).find((rank) => Ranks[rank] === Ranks.FOUR);

        return {
            drawn: drawnCard,
            trump: { rank: trumpRank, suit: drawnCard.suit },
        };
    }

    // TODO: Move to deck
    drawCards(count) {
        let drawnCards = [];

        for (let i = 0; i < count; i++) {
            drawnCards.push(this.deck.pop());
        }

        return drawnCards;
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }

        return this.deck;
    }

    reset() {
        this.deck = this._buildDeck();
    }
}
