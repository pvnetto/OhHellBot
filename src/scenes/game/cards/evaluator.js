const { Ranks, Suits } = require('./types');

function evaluateCards(cards, trumpCard) {
    let evaluatedCards = [];
    let spoiledCards = [];
    let winnerCard = null;

    cards.forEach(currentCard => {
        if (_checkSpoiledCards(currentCard, evaluatedCards, spoiledCards, trumpCard)) {
            // Handles the case where the current winner is spoiled by the card played
            if (currentCard.rank !== winnerCard.rank) {
                const unspoiledCards = evaluatedCards.filter(evaluatedCard => !spoiledCards.includes(evaluatedCard));
                winnerCard = evaluateCards(unspoiledCards, trumpCard);
            }
        }
        else {
            // If the current card isn't spoiled, checks if it's bigger than the current winner card
            winnerCard = _getBiggestCard(currentCard, winnerCard, trumpCard);
            evaluatedCards.push(currentCard);
        }
    });

    return winnerCard;
}

function _checkSpoiledCards(currentCard, cardsPlayed, spoiledCards, trumpCard) {
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

function _getBiggestCard(playedCard, winnerCard, trumpCard) {
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

exports.evaluateCards = evaluateCards;