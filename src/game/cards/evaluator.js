const { Ranks, Suits } = require('./types');
const { Card } = require('./card');

function evaluateCards(cards, trumpCard) {
    if (!trumpCard instanceof Card) throw new TypeError(`Error. Trump Card is not a Card.`);
    if (!cards.every(card => card instanceof Card)) throw new TypeError(`Error. One or more of the cards is not a Card.`);

    let evaluatedCards = [];
    let spoiledCards = [];
    let winnerCard = null;

    cards.forEach(currentCard => {
        if (_isCardSpoiled(currentCard, evaluatedCards, spoiledCards, trumpCard)) {
            // Handles the case where the current winner is spoiled by the card played
            if (winnerCard && currentCard.rank === winnerCard.rank) {
                const unspoiledCards = evaluatedCards.filter(evaluatedCard => !spoiledCards.includes(evaluatedCard));
                winnerCard = evaluateCards(unspoiledCards, trumpCard);
            }
        }
        else {
            winnerCard = _getBiggestCard(currentCard, winnerCard, trumpCard);
            evaluatedCards.push(currentCard);
        }
    });

    return winnerCard;
}

// Checks if a card is spoiled, and if so, adds it to the list of spoiled cards
function _isCardSpoiled(currentCard, cardsPlayed, spoiledCards, trumpCard) {
    if (currentCard.rank === trumpCard.rank) {
        return false;
    }

    // Checks 
    for (let i = 0; i < spoiledCards.length; i++) {
        const spoiledCard = spoiledCards[i];
        if (currentCard.rank === spoiledCard.rank) {
            spoiledCards.push(currentCard);
            return true;
        }
    }

    for (let i = 0; i < cardsPlayed.length; i++) {
        const playedCard = cardsPlayed[i];
        if (currentCard.rank === playedCard.rank) {
            spoiledCards.push(currentCard);
            spoiledCards.push(playedCard);
            return true;
        }
    }

    return false;
}

function _getBiggestCard(playedCard, currentWinner, trumpCard) {
    // Handles the case where there's still no winner
    if (!currentWinner) {
        return playedCard;
    }
    // Handles the case where the played card is a trump
    if (playedCard.rank === trumpCard.rank) {
        if (currentWinner.rank !== trumpCard.rank) {
            return playedCard;
        }
        else if (currentWinner.rank === trumpCard.rank) {
            return Suits[playedCard.suit] > Suits[currentWinner.suit] ? playedCard : currentWinner;
        }
    }
    // Compares the played card with the current winner
    else {
        return Ranks[playedCard.rank] > Ranks[currentWinner.rank] ? playedCard : currentWinner;
    }
}

exports.evaluateCards = evaluateCards;