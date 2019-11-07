const Extra = require('telegraf/extra');
const { reorderPlayers } = require('../utils');
const { States } = require('../states');

module.exports = class BetManager {

    constructor({ game }) {
        this.players = [...game.gameManager.players];
        this.roundCount = game.gameManager.roundCount;
        this.cardCount = game.gameManager.cardsToDraw;

        // Bet variables
        this.bets = {};
        this.currentPlayerIdx = 0;

        this.beginBetPhase.bind(this);
        this._announceBetTurnPlayer.bind(this);
        this.bet.bind(this);
        this._placeBet.bind(this);
        this._checkInvalidBetSum.bind(this);
        this._getValidBetValues.bind(this);
        this._getInvalidBetValues.bind(this);
        this.listBets.bind(this);

        game.betManager = this;
    }

    get isFirstRound() { return this.roundCount === 1; }

    async beginBetPhase({ lobby, telegram }) {
        if (!this.isFirstRound) {
            this.players = reorderPlayers(this.players, this.players[1]);
        }

        const betOrderMsg = this._getBetOrderMsg();
        await telegram.sendMessage(lobby.groupId, `\n*Beginning the bet round.*\n${betOrderMsg}`, { parse_mode: 'markdown' });
        await this._announceBetTurnPlayer({ lobby, telegram });
    }

    async _announceBetTurnPlayer({ lobby, telegram }) {
        const currentPlayer = this.players[this.currentPlayerIdx];
        await telegram.sendMessage(lobby.groupId, `It's [${currentPlayer.first_name}](tg://user?id=${currentPlayer.id})'s turn to bet.`,
            {
                parse_mode: 'markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Make your bet", switch_inline_query_current_chat: '' }],
                        [{ text: `Check your${this.roundCount === 1 ? ` opponent's ` : ' '}cards`, switch_inline_query_current_chat: 'check' }]
                    ],
                    force_reply: false,
                }
            }
        );
    }

    async bet({ from, message, lobby, game, telegram, reply }) {
        let betValue = message.text.split(' ').slice(1).join('');
        betValue = parseInt(betValue);
        await this._placeBet(from, betValue, { lobby, game, telegram, reply });
    }

    async _placeBet(betPlayer, betValue, { lobby, game, telegram, reply }) {
        // Checks if the bet is valid
        let turnPlayer = this.players[this.currentPlayerIdx];
        if (betPlayer.id != turnPlayer.id) return await reply(`It's not your turn to bet!`);
        if (!Number.isInteger(betValue)) return await reply('Please, enter a valid bet value.');
        if (betValue < 0) return await reply(`You can't bet a negative value.`);
        if (betValue > this.cardCount) return await reply(`You can't bet a value greater than the number of cards in your hand.`)
        if (this._checkInvalidBetSum(betValue)) return await reply(`Invalid bet value. The sum of all bets can't match the number of drawn cards.`);

        this.bets[betPlayer.id] = betValue;
        this.currentPlayerIdx += 1;

        // Checks if the bet round has ended
        if (this.currentPlayerIdx >= this.players.length) {
            const betListMsg = this._getBetListMsg();
            await telegram.sendMessage(lobby.groupId, `*Bet round ended.*\n${betListMsg}`, { parse_mode: 'markdown' });
            await game.gameManager.switchState(States.ROUND);
        }
        else {
            await this._announceBetTurnPlayer({ lobby, telegram });
        }
    }

    _checkInvalidBetSum(newBet) {
        if (this.isFirstRound || this.currentPlayerIdx < this.players.length - 1) return false;

        let currentSum = Object.keys(this.bets).reduce((newSum, key) => {
            newSum += this.bets[key];
            return newSum;
        }, 0);

        currentSum += newBet;
        return currentSum === this.cardCount;
    }

    _getValidBetValues() {
        let betRange = [...Array(this.cardCount + 1).keys()];
        const invalidBetValues = this._getInvalidBetValues();
        betRange = betRange.reduce((newArr, val) => {
            if (!invalidBetValues.includes(val)) newArr.push(val);
            return newArr;
        }, []);

        return betRange;
    }

    _getInvalidBetValues() {
        if (this.isFirstRound || this.currentPlayerIdx < this.players.length - 1) return [];

        let currentSum = Object.keys(this.bets).reduce((newSum, key) => {
            newSum += this.bets[key];
            return newSum;
        }, 0);

        if (currentSum > this.cardCount) return [];

        return [Math.abs(this.cardCount - currentSum)];
    }

    async getBetInlineQueryOptions(hands, { inlineQuery, game, telegram }) {
        if (inlineQuery.query === 'check') {
            return await this._inlineQueryCards(hands, { game, telegram });
        }
        else {
            const betValues = this._getValidBetValues();
            const betOptions = betValues.map((val, idx) => (this._makeQueryArticle(idx, `Bet ${val}`, `Bet ${val}`, '', `/bet ${val}`)));
            betOptions.push(this._makeQueryArticle(betValues.length + 1, 'Show Bets', 'Show bets for this round', '', '/bets'));
            return betOptions;
        }
    }

    async _inlineQueryCards(hands, { game, telegram }) {
        let queryCards = [];

        // Shows opponent's cards on round 1
        if (this.roundCount === 1) {
            this.players.forEach((player) => {
                Object.keys(hands).forEach(async (id) => {
                    if (id != player.id) {
                        const playerCard = hands[id][0];
                        const cardSticker = await game.stickerManager.getStickerByCard(playerCard, { telegram });
                        queryCards.push({ type: 'sticker', id: id, sticker_file_id: cardSticker.file_id, input_message_content: { message_text: `I'm trying to play a card because I'm stupid.` } });
                    }
                });
            });
        }
        else {
            this.players.forEach((player) => {
                hands[player.id].forEach(async (playerCard, idx) => {
                    const cardSticker = await game.stickerManager.getStickerByCard(playerCard, { telegram });
                    const queryIdx = (idx + 1) * 100;
                    queryCards.push({ type: 'sticker', id: queryIdx, sticker_file_id: cardSticker.file_id, input_message_content: { message_text: `I'm trying to play a card because I'm stupid.` } });
                });
            });
        }

        return queryCards;
    }

    _makeQueryArticle(id, title, description, thumb_url, message_text) {
        return { type: 'article', id, title, description, thumb_url, input_message_content: { message_text } };
    }

    async listBets({ lobby, telegram }) {
        let msg = this._getBetListMsg();
        await telegram.sendMessage(lobby.groupId, msg);
    }

    _getBetListMsg() {
        if (Object.keys(this.bets).length === 0) 'No bets were placed this round.';
        let msg = 'Bets for this round:\n';

        Object.keys(this.bets).forEach(key => {
            const betPlayer = this.players.find(player => player.id == key);
            const betValue = this.bets[key];
            msg += `${betPlayer.first_name} - ${betValue}\n`;
        });

        return msg;
    }

    _getBetOrderMsg() {
        let msg = `Bet order:\n`;
        this.players.forEach((player, idx) => msg += `${idx} - ${player.first_name}`);

        return msg;
    }

}