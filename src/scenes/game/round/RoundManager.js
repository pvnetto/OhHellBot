const Extra = require('telegraf/extra');
const { reorderPlayers } = require('../utils');
const { evaluateCards } = require('../cards/evaluator');

module.exports = class RoundManager {

    constructor({ game }) {
        this.players = [...game.gameManager.players];
        this.cardDealer = this.players[0];

        // The closest player to the card server starts playing, except for the first round
        if (game.gameManager.roundCount !== 1) {
            this.players = reorderPlayers(this.players, this.players[1]);
        }

        // This object is responsible for managing the remaining cards in a player's hands
        this.hands = Object.assign({}, game.gameManager.hands);
        this._playMsgs = {};

        // Round variables
        this.roundScores = this.players.reduce((newObj, player) => {
            newObj[player.id] = 0;
            return newObj;
        }, {});
        this._currentRoundCount = game.gameManager.roundCount;

        // Turn variables
        this._turnPlayerIdx = 0;
        this.turnCards = {};

        game.roundManager = this;
    }

    get isLastTurnOfRound() { return this.hands[this.players[0].id].length <= 1; }

    async startTurn({ lobby, game, telegram, reply }) {
        this.turnCards = {};
        this._turnPlayerIdx = 0;

        const playOrderMsg = this._getPlayOrderMsg();
        await telegram.sendMessage(lobby.groupId, `*Starting a new play turn.*\n${playOrderMsg}\n`, { parse_mode: 'markdown' });
        await this._sendTurnPlayerAnnounce({ lobby, telegram });

        // Resolves the turn automatically if each player has only 1 card left
        await this._handleAutoPlayLastCards({ lobby, game, telegram, reply });
    }

    async _sendTurnPlayerAnnounce({ lobby, telegram }) {
        if (!this.isLastTurnOfRound) {
            let nextPlayer = this.players[this._turnPlayerIdx];
            await telegram.sendMessage(lobby.groupId, `It's [${nextPlayer.first_name}](tg://user?id=${nextPlayer.id})'s turn to play.`,
                {
                    parse_mode: 'markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: "Play a card", switch_inline_query_current_chat: '' }]],
                        force_reply: false,
                    }
                }
            );
        }
    }

    async _handleAutoPlayLastCards({ lobby, game, telegram, reply }) {
        // Resolves the turn automatically if each player has only 1 card left
        if (this.isLastTurnOfRound) {
            let turnPromises = this.players.map(async (player) => {
                await this._placeCard(player, 0, { lobby, game, telegram, reply })
            });

            return await Promise.all(turnPromises);
        }
    }

    async playCard({ from, message, lobby, game, telegram, reply }) {
        const card = await game.stickerManager.getCardBySticker(message.sticker, { telegram });
        if (card) {
            let cardIdx = this.hands[from.id].findIndex(playerCard => playerCard.suit === card.suit && playerCard.rank === card.rank);
            return await this._placeCard(from, cardIdx, { lobby, game, telegram, reply });
        }
    }

    async _placeCard(cardPlayer, cardIdx, { lobby, game, telegram, reply }) {
        let turnPlayer = this.players[this._turnPlayerIdx];
        if (!turnPlayer || cardPlayer.id != turnPlayer.id) return await reply(`It's not your turn to play!`);
        if (!Number.isInteger(cardIdx)) return await reply('Please, choose a valid card.');
        if (cardIdx < 0 || cardIdx >= this.hands[cardPlayer.id].length) return await reply('Please, choose a valid card.');

        if (this.isLastTurnOfRound) {
            const card = this.hands[cardPlayer.id][cardIdx];
            const cardSticker = await game.stickerManager.getStickerByCard(card, { telegram });
            await telegram.sendMessage(lobby.groupId, `[${cardPlayer.first_name}](tg://user?id=${cardPlayer.id}) plays:`, { parse_mode: 'markdown' });
            await telegram.sendSticker(lobby.groupId, cardSticker.file_id);
        }

        // Removes card from player hand and places it on the pile of turn cards
        let [playedCard] = this.hands[cardPlayer.id].splice(cardIdx, 1);
        this.turnCards[cardPlayer.id] = playedCard;

        // Increments turn player index
        this._turnPlayerIdx += 1;
        if (this._turnPlayerIdx >= this.players.length) {
            await this._evaluateTurnCards({ game, lobby, telegram });

            let firstPlayerCards = this.hands[this.players[0].id];
            if (firstPlayerCards.length === 0) {
                await game.gameManager.endRound(game.betManager.bets, this.roundScores, { lobby, game, telegram });
            }
            else {
                await this.startTurn({ game, lobby, telegram, reply });
            }
        }
        else {
            await this._sendTurnPlayerAnnounce({ lobby, telegram });
        }
    }

    async _evaluateTurnCards({ game, lobby, telegram }) {
        const playedCards = Object.values(this.turnCards);
        const trumpCard = game.gameManager.trumpCard;
        const winnerCard = evaluateCards(playedCards, trumpCard);

        let turnMsg = `*End of turn.*\n`

        let turnWinner = null;
        if (winnerCard) {
            const winnerId = Object.keys(this.turnCards).find(key => this.turnCards[key] == winnerCard);
            turnWinner = this.players.find(player => player.id == winnerId);
            turnMsg += `*${turnWinner.first_name} wins* this turn with a ${winnerCard.rank} of ${winnerCard.suit}.\n`;
        }
        else {
            turnWinner = this.cardDealer;
            turnMsg += `All cards were spoiled! *${this.cardDealer.first_name} wins* this round.\n`;
        }

        this.roundScores[turnWinner.id] += 1;
        this.players = reorderPlayers(this.players, turnWinner);

        turnMsg += this._getRoundScoreMsg();
        await telegram.sendMessage(lobby.groupId, turnMsg, { parse_mode: 'markdown' });
    }

    async getPlayerInlineQueryOptions({ from, game, telegram }) {
        if (this._currentRoundCount === 1) return [];

        const playerCards = this.hands[from.id];
        const cardOptions = [];
        const cardPromises = playerCards.map(async (card, idx) => {
            const cardSticker = await game.stickerManager.getStickerByCard(card, { telegram });
            cardOptions.push({ type: 'sticker', id: idx, sticker_file_id: cardSticker.file_id, });
        });
        await Promise.all(cardPromises);

        return cardOptions;
    }

    async listRoundScore({ lobby, telegram }) {
        let msg = this._getRoundScoreMsg();
        await telegram.sendMessage(lobby.groupId, msg);
    }

    _getRoundScoreMsg() {
        let msg = 'Round score:\n';

        msg += Object.keys(this.roundScores).reduce((newMsg, key) => {
            const roundPlayer = this.players.find(player => player.id == key);
            const playerScore = this.roundScores[key];
            newMsg += `${roundPlayer.first_name} - Wins: ${playerScore}\n`;
            return newMsg;
        }, "");

        return msg;
    }

    _getPlayOrderMsg() {
        let msg = `Play order for this turn:\n`;
        this.players.forEach((player, idx) => msg += `${idx} - ${player.first_name}\n`);
        return msg;
    }

}