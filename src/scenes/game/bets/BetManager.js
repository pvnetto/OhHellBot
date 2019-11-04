const Extra = require('telegraf/extra');
const { reorderPlayers } = require('../utils');

module.exports = class BetManager {

    constructor({ game, scene }) {
        this.players = [...game.gameManager.players];
        this.isFirstRound = game.gameManager.roundCount === 1;
        this.cardCount = game.gameManager.cardsToDraw;

        if (this.isFirstRound) {
            this.players = reorderPlayers(this.players, this.players[1]);
        }

        // Game variables
        this.scene = scene;
        game.betManager = this;

        // Bet variables
        this.bets = {};
        this.currentPlayerIdx = 0;

        this.beginBetPhase.bind(this);
        this._sendMessageToBetPlayer.bind(this);
        this.bet.bind(this);
        this._placeBet.bind(this);
        this._checkInvalidBetSum.bind(this);
        this._getValidBetValues.bind(this);
        this._getInvalidBetValues.bind(this);
        this.listBets.bind(this);
    }

    async beginBetPhase({ lobby, telegram }) {
        await telegram.sendMessage(lobby.groupId, 'Beginning the bet round.');
        await this._sendMessageToBetPlayer({ lobby, telegram });
    }

    async _sendMessageToBetPlayer({ lobby, telegram }) {
        const currentPlayer = this.players[this.currentPlayerIdx];
        await telegram.sendMessage(lobby.groupId, `It's ${currentPlayer.first_name}'s turn to bet.`);

        const betRange = this._getValidBetValues();
        const betOptions = Extra.HTML().markup((m) => (
            m.inlineKeyboard(
                betRange.reduce((btns, num) => {
                    btns.push(m.callbackButton(`Bet ${num}`, `bet ${num}`));
                    return btns;
                }, [])
            )
        ));

        await telegram.sendMessage(currentPlayer.id, `It's your turn to bet.`, betOptions);
    }

    async bet({ from, message, lobby, telegram, reply }) {
        let betValue = message.text.split(' ').slice(1).join('');
        betValue = parseInt(betValue);
        return await this._placeBet(from, betValue, { lobby, telegram, reply });
    }

    async delegateBet({ from, lobby, match, telegram, reply }) {
        await this._placeBet(from, parseInt(match[1]), { lobby, telegram, reply });
    }

    async _placeBet(betPlayer, betValue, { lobby, telegram, reply }) {
        let turnPlayer = this.players[this.currentPlayerIdx];
        if (betPlayer.id != turnPlayer.id) return await reply(`It's not your turn to bet!`);
        if (!Number.isInteger(betValue)) return reply('Please, enter a valid bet value.');
        if (betValue < 0) return await reply(`You can't bet a negative value.`);
        if (this._checkInvalidBetSum(betValue)) return await reply(`Invalid bet value. The sum of all bets can't match the number of drawn cards.`);

        this.bets[betPlayer.id] = betValue;
        this.currentPlayerIdx += 1;
        await telegram.sendMessage(lobby.groupId, `${betPlayer.first_name} placed a bet of ${betValue}.`);

        // Checks if the bet round has ended
        if (this.currentPlayerIdx >= this.players.length) {
            await telegram.sendMessage(lobby.groupId, `Bet phase ended!`);
            await this.listBets({ lobby, telegram });
            await this.scene.enter('round');
        }
        else {
            await this.sendMessageToBetPlayer({ telegram, lobby });
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

        if (newSum > this.cardCount) return [];

        return [Math.abs(this.cardCount - newSum)];
    }

    async listBets({ lobby, telegram }) {
        if (Object.keys(this.bets).length === 0) return telegram.sendMessage(lobby.groupId, 'No bets were placed this round.');

        let msg = 'Bets for this round:\n';

        Object.keys(this.bets).forEach(key => {
            const betPlayer = this.players.find(player => player.id == key);
            const betValue = this.bets[key];
            msg += `${betPlayer.first_name} - ${betValue}\n`;
        });

        await telegram.sendMessage(lobby.groupId, msg);
    }

}