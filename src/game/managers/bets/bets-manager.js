const { reorderPlayers } = require('../utils');
const { States } = require('../game/states');
const { queryBetOptions, queryCards } = require('./queries');

module.exports = class BetsManager {

    constructor({ db, session }) {
        this.players = [...session.game.gameManager.players];
        this.roundCount = session.game.gameManager.roundCount;
        this.cardCount = session.game.gameManager.cardsToDraw;

        if (!this.isFirstRound) {
            this.players = reorderPlayers(this.players, this.players[1]);
        }

        // Adds a reference to this for each player
        this.players.forEach(player => db[player.id].betManager = this);

        // Bet variables
        this.bets = {};
        this.currentPlayerIdx = 0;
    }

    get isFirstRound() { return this.roundCount === 1; }

    async beginBetPhase({ session, telegram }) {
        const betOrderMsg = this.makeBetOrderMsg();
        await telegram.sendMessage(session.lobby.groupId, `\n*Beginning the bet round.*\n${betOrderMsg}`, { parse_mode: 'markdown' });
        await this.announceBetTurnPlayer({ session, telegram });
    }

    async announceBetTurnPlayer({ session, telegram }) {
        const currentPlayer = this.players[this.currentPlayerIdx];
        await telegram.sendMessage(session.lobby.groupId, `It's [${currentPlayer.first_name}](tg://user?id=${currentPlayer.id})'s turn to bet.`,
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

    async bet({ from, message, session, telegram, reply }) {
        let betValue = message.text.split(' ').slice(1).join('');
        betValue = parseInt(betValue);
        await this.placeBet(from, betValue, { session, telegram, reply });
    }

    async placeBet(betPlayer, betValue, { session, telegram, reply }) {
        // Checks if the bet is valid
        let turnPlayer = this.players[this.currentPlayerIdx];
        if (betPlayer.id != turnPlayer.id) return await reply(`It's not your turn to bet!`);
        if (!Number.isInteger(betValue)) return await reply('Please, enter a valid bet value.');
        if (betValue < 0) return await reply(`You can't bet a negative value.`);
        if (betValue > this.cardCount) return await reply(`You can't bet a value greater than the number of cards in your hand.`)
        if (this.isBetSumValid(betValue)) return await reply(`Invalid bet value. The sum of all bets can't match the number of drawn cards.`);

        this.bets[betPlayer.id] = betValue;
        this.currentPlayerIdx += 1;

        // Checks if the bet round has ended
        if (this.currentPlayerIdx >= this.players.length) {
            const betListMsg = this.makeBetListMsg();
            await telegram.sendMessage(session.lobby.groupId, `*Bet round ended.*\n${betListMsg}`, { parse_mode: 'markdown' });
            await session.game.gameManager.switchState(States.ROUND);
        }
        else {
            await this.announceBetTurnPlayer({ session, telegram });
        }
    }


    isBetSumValid(betValue) {
        if (this.isFirstRound || this.currentPlayerIdx < this.players.length - 1) return false;

        let currentSum = Object.keys(this.bets).reduce((currentSum, playerId) => {
            currentSum += this.bets[playerId];
            return currentSum;
        }, betValue);

        return currentSum === this.cardCount;
    }

    getValidBetValues() {
        let betRange = [...Array(this.cardCount + 1).keys()];
        const invalidBetValues = this.getInvalidBetValues();
        betRange = betRange.reduce((newArr, val) => {
            if (!invalidBetValues.includes(val)) newArr.push(val);
            return newArr;
        }, []);

        return betRange;
    }

    getInvalidBetValues() {
        if (this.isFirstRound || this.currentPlayerIdx < this.players.length - 1) return [];

        let currentSum = Object.keys(this.bets).reduce((newSum, key) => {
            newSum += this.bets[key];
            return newSum;
        }, 0);

        if (currentSum > this.cardCount) return [];

        return [Math.abs(this.cardCount - currentSum)];
    }

    async listBets({ session, telegram }) {
        let msg = this.makeBetListMsg();
        await telegram.sendMessage(session.lobby.groupId, msg);
    }

    makeBetListMsg() {
        if (Object.keys(this.bets).length === 0) return 'No bets were placed this round.';

        return Object.keys(this.bets).reduce((msg, playerId) => {
            const betPlayer = this.players.find(player => player.id == playerId);
            const betValue = this.bets[playerId];
            msg += `${betPlayer.first_name} - ${betValue}\n`;
            return msg;
        }, 'Bets for this round:\n');
    }

    makeBetOrderMsg() {
        return this.players.reduce((msg, player, idx) => {
            msg += `${idx} - ${player.first_name}\n`
            return msg;
        }, `Bet order:\n`);
    }

    async handleInlineQuery(hands, { stickerManager, from, inlineQuery, telegram }) {
        if (inlineQuery.query === 'check') {
            return await queryCards(hands, this.roundCount, { stickerManager, from, telegram });
        }
        else {
            return queryBetOptions(this.getValidBetValues());
        }
    }

}