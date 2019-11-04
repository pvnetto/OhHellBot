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

    drawSingleCard() {
        return this.deck.pop();
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

    evaluateCards(cards, trumpCard) {
        let evaluatedCards = [];
        let spoiledCards = [];
        let winnerCard = null;

        cards.forEach(currentCard => {
            if (this._checkSpoiledCards(currentCard, evaluatedCards, spoiledCards, trumpCard)) {
                // Handles the case where the current winner is spoiled by the card played
                if (currentCard.rank !== winnerCard.rank) {
                    const unspoiledCards = evaluatedCards.filter(evaluatedCard => !spoiledCards.includes(evaluatedCard));
                    winnerCard = this.evaluateCards(unspoiledCards, trumpCard);
                }
            }
            else {
                // If the current card isn't spoiled, checks if it's bigger than the current winner card
                winnerCard = this._getBiggestCard(currentCard, winnerCard, trumpCard);
                evaluatedCards.push(currentCard);
            }
        });

        return winnerCard;
    }

    _checkSpoiledCards(currentCard, cardsPlayed, spoiledCards, trumpCard) {
        if (currentCard.rank === trumpCard.rank) {
            return false;
        }

        // Checks 
        spoiledCards.forEach(spoiledCard => {
            if (currentCard.rank === spoiledCard.rank) {
                spoiledCards.push(currentCard);
                return true;
            }
        })

        cardsPlayed.forEach(playedCard => {
            if (currentCard.rank === playedCard.rank) {
                spoiledCards.push(currentCard, playedCard);
                return true;
            }
        });

        return false;
    }

    _getBiggestCard(playedCard, winnerCard, trumpCard) {
        // Handles the case where there's still no winner
        if (!winnerCard) {
            return playedCard;
        }
        // Handles the case where the played card is a trump
        if (playedCard.rank === trumpCard.rank) {
            if (winnerCard.rank !== trumpCard.rank) {
                return playedCard;
            }
            else if (winnerCard.rank === trumpCard.rank) {
                return Suits[playedCard.suit] > Suits[winnerCard.suit] ? playedCard : winnerCard;
            }
        }
        // Compares the played card with the current winner
        else {
            return Ranks[playedCard.rank] > Ranks[winnerCard.rank] ? playedCard : winnerCard;
        }
    }
}

const Ranks = {
    FOUR: 0,
    FIVE: 1,
    SIX: 2,
    SEVEN: 3,
    JACK: 4,
    QUEEN: 5,
    KING: 6,
    ACE: 7,
    TWO: 8,
    THREE: 9,
}

const Suits = {
    DIAMONDS: 0,
    SPADES: 1,
    HEARTS: 2,
    CLUBS: 3,
}