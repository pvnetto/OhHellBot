exports.queryBetOptions = function (betValues) {
    const betOptions = betValues.map((val, idx) => (makeQueryArticle(idx, `Bet ${val}`, `Bet ${val}`, '', `/bet ${val}`)));
    betOptions.push(makeQueryArticle(betValues.length + 1, 'Show Bets', 'Show bets for this round', '', '/bets'));
    return betOptions;
}

exports.queryCards = async function (hands, roundCount, { stickerManager, from, telegram }) {
    let queryCards = [];

    // Shows opponent's cards on round 1, that is, the first card of each hand, except for the player's own hand
    if (roundCount === 1) {
        queryCards = queryOpponentCards(hands, { stickerManager, from, telegram });
    }
    else {
        queryCards = queryPlayerCards(hands, { stickerManager, from, telegram });
    }

    return queryCards;
}

function queryOpponentCards(hands, { stickerManager, from, telegram }) {
    const queryCards = [];
    Object.keys(hands).forEach(async (handId) => {
        if (from.id != handId) {
            const playerCard = hands[handId][0];
            const cardSticker = await stickerManager.getStickerByCard(playerCard, { telegram });
            queryCards.push({ type: 'sticker', id: handId, sticker_file_id: cardSticker.file_id, input_message_content: { message_text: `It's not my turn to play a card.` } });
        }
    });

    return queryCards;
}

function queryPlayerCards(hands, { stickerManager, from, telegram }) {
    const queryCards = [];
    hands[from.id].forEach(async (playerCard, idx) => {
        const cardSticker = await stickerManager.getStickerByCard(playerCard, { telegram });
        const queryIdx = (idx + 1) * 100;
        queryCards.push({ type: 'sticker', id: queryIdx, sticker_file_id: cardSticker.file_id, input_message_content: { message_text: `It's not my turn to play a card.` } });
    });

    return queryCards;
}

function makeQueryArticle(id, title, description, thumb_url, message_text) {
    return { type: 'article', id, title, description, thumb_url, input_message_content: { message_text } };
}