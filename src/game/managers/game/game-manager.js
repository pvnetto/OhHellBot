const CardsDeck = require('../../cards/deck');
const { reorderPlayers } = require('../utils');
const { States } = require('./states');

module.exports = class GameManager {

    constructor({ db, session, scene }) {
        // Match parameters
        this.players = [...session.lobby.players];
        this.startPlayers = [...this.players];
        this.owner = Object.assign({}, session.lobby.owner);
        this.scene = scene;
        this._currentState = States.DRAW;

        // Adds a reference for this to each player
        this.players.forEach(player => db[player.id].gameManager = this);

        // Picks a random player to be the first to shuffle/play
        let startingPlayerIdx = Math.floor(Math.random() * this.players.length);
        this.players = reorderPlayers(this.players, this.players[startingPlayerIdx])

        // Game State variables
        this.roundCount = 1;
        this._currentTrump = null;
        this.strikes = this.players.reduce((newObj, player) => {
            newObj[player.id] = 0;
            return newObj;
        }, {});

        // Deck variables
        this.deck = new CardsDeck();

        // Draw variables
        this.cardsToDraw = 1;
        this.maxDraw = Math.min(Math.floor((this.deck.maxDeckSize - 1) / this.players.length), 7);
        this.reachedMaxDraw = false;
        this.hands = {};

        // Binding methods
        this.distributeCards.bind(this);
        this.endRound.bind(this);
        this._resolveRound.bind(this);
        this._handleCardsToDrawIncrement.bind(this);
    }

    get trumpCard() { return this._currentTrump; }

    async switchState(newState) {
        switch (newState) {
            case States.BET:
                this._currentState = States.BET;
                await this.scene.enter('bets');
                break;
            case States.ROUND:
                this._currentState = States.ROUND;
                await this.scene.enter('round');
                break;
            default:
                this._currentState = States.DRAW;
                break;
        }
    }

    async getInlineQueryOptions({ stickerManager, from, inlineQuery, db, telegram }) {
        const userDb = db[from.id];

        if (this._currentState === States.BET && userDb.betManager) {
            return await userDb.betManager.getBetInlineQueryOptions(this.hands, { stickerManager, from, inlineQuery, telegram });
        }
        else if (this._currentState === States.ROUND && userDb.roundManager) {
            return await userDb.roundManager.getPlayerInlineQueryOptions({ stickerManager, from, telegram });
        }
        return [];
    }

    async distributeCards({ stickerManager, session, telegram }) {
        let firstPlayer = this.players[0];

        this.deck.reset();
        this.deck.shuffle();
        const { drawn, trump } = this.deck.drawTrumpCard();
        this._currentTrump = trump;

        this.players.forEach(player => {
            this.hands[player.id] = this.deck.drawCards(this.cardsToDraw);
        });

        await this._sendCardSticker(session.lobby.groupId, this._currentTrump, { stickerManager, telegram });

        const roundStartMsg =
            `*Round #${this.roundCount}.*\n`
            + `${firstPlayer.first_name} deals ${this.cardsToDraw} card${this.cardsToDraw > 1 ? 's' : ''} for each player.\n`
            + `The trump card for this round is ${this._currentTrump.rank} of ${this._currentTrump.suit}.`;
        await telegram.sendMessage(session.lobby.groupId, roundStartMsg, { parse_mode: 'markdown' });
    }

    async _sendCardSticker(id, card, { stickerManager, telegram }) {
        const cardSticker = await stickerManager.getStickerByCard(card, { telegram });
        await telegram.sendSticker(id, cardSticker.file_id);
    }

    async endRound(bets, roundScores, { db, session, telegram }) {

        await this._resolveRound(bets, roundScores, { session, telegram });

        // Checks if match has ended
        if (this.players.length <= 1) {
            if (this.players.length === 1) {
                let winner = this.players[0];
                await telegram.sendMessage(session.lobby.groupId, `Game over.\n${winner.first_name} is the winner!`);
            }
            else {
                await telegram.sendMessage(session.lobby.groupId, `Game over.\nIt's a draw!`);
            }

            // Removes match players from db
            this.startPlayers.forEach(player => db[player.id] && delete db[player.id]);
            session.lobby = {};
            session.game = {};
            await this.scene.enter('greeter');
        }
        else {
            this.players = reorderPlayers(this.players, this.players[1]);
            this.roundCount += 1;
            this._handleCardsToDrawIncrement();
            await this.switchState(States.BET);
        }
    }

    async _resolveRound(bets, roundScores, { session, telegram }) {
        let roundMsg = `*End of round #${this.roundCount}*\n`;
        this.startPlayers.forEach((currentPlayer) => {
            if (this.players.includes(currentPlayer)) {
                let strikeCount = Math.abs(bets[currentPlayer.id] - roundScores[currentPlayer.id]);
                this.strikes[currentPlayer.id] += strikeCount;

                const currentPlayerStrikes = this.strikes[currentPlayer.id];
                const isEliminated = currentPlayerStrikes >= 5;

                if (isEliminated) {
                    let eliminatedIdx = this.players.findIndex(player => player.id == currentPlayer.id);
                    let [eliminatedPlayer] = this.players.splice(eliminatedIdx, 1);
                }

                roundMsg += `[${currentPlayer.first_name}](tg://user?id=${currentPlayer.id}) - Strikes: ${strikeCount} | `
                    + `Total: ${currentPlayerStrikes}${isEliminated ? '| Eliminated' : ''}\n`;
            }
            else {
                roundMsg += `${currentPlayer.first_name} - Eliminated.\n`;
            }
        });

        await telegram.sendMessage(session.lobby.groupId, roundMsg, { parse_mode: 'markdown' });
    }

    _handleCardsToDrawIncrement() {
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