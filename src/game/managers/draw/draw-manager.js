const CardsDeck = require('../../cards/deck');

module.exports = class DrawManager {

    constructor(players) {
        // Deck variables
        this.deck = new CardsDeck();

        // Draw variables
        this.cardsToDraw = 1;
        this.maxDraw = Math.min(Math.floor((this.deck.maxDeckSize - 1) / players.length), 7);
        this.reachedMaxDraw = false;

        // Round variables
        this.hands = {};
        this.currentTrump = null;
    }

    async distributeCards(players, roundCount, { stickerManager, session, telegram }) {
        this.deck.reset();
        this.deck.shuffle();
        const { drawn, trump } = this.deck.drawTrumpCard();
        this.currentTrump = trump;

        players.forEach(player => {
            this.hands[player.id] = this.deck.drawCards(this.cardsToDraw);
        });

        let firstPlayer = players[0];
        await this._sendRoundStartMessage(firstPlayer, roundCount, { stickerManager, session, telegram });
    }

    async _sendRoundStartMessage(firstPlayer, roundCount, { stickerManager, session, telegram }) {
        // Sends trump card sticker
        const cardSticker = await stickerManager.getStickerByCard(this.currentTrump, { telegram });
        await telegram.sendSticker(session.lobby.groupId, cardSticker.file_id);

        const roundStartMsg =
            `*Round #${roundCount}.*\n`
            + `${firstPlayer.first_name} deals ${this.cardsToDraw} card${this.cardsToDraw > 1 ? 's' : ''} for each player.\n`
            + `The trump card for this round is ${this.currentTrump.rank} of ${this.currentTrump.suit}.`;
        await telegram.sendMessage(session.lobby.groupId, roundStartMsg, { parse_mode: 'markdown' });
    }

    handleCardsToDrawIncrement() {
        // Handles the case where the player reached the max draw count by reversing the increment of cards to draw
        if (!this.reachedMaxDraw && this.cardsToDraw >= this.maxDraw) {
            this.reachedMaxDraw = true;
        }
        else if (this.reachedMaxDraw && this.cardsToDraw - 1 <= 0) {
            this.reachedMaxDraw = false;
        }
        this.cardsToDraw = this.reachedMaxDraw ? this.cardsToDraw - 1 : this.cardsToDraw + 1;
    }

}