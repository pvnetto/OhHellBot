const { reorderPlayers } = require('../utils');

module.exports = class RoundManager {

    constructor(gameManager) {
        this.players = [...gameManager.players];
        this.cardServer = this.players[0];

        // The closest player to the card server starts playing, except for the first round
        if (gameManager.roundCount !== 1) {
            this.players = reorderPlayers(this.players, this.players[1]);
        }

        // This object is responsible for managing the remaining cards in a player's hands
        this.hands = Object.assign({}, gameManager.hands);

        // Round variables
        this.roundScores = this.players.reduce((newObj, player) => {
            newObj[player.id] = 0;
            return newObj;
        }, {});

        // Turn variables
        this.turnPlayerIdx = 0;
        this.turnCards = {};
    }

    async startTurn({ message, scene, game, reply }) {
        this.turnCards = {};
        this.turnPlayerIdx = 0;

        const firstPlayer = this.players[0];
        await reply(`${firstPlayer.first_name} starts playing.`);

        // Resolves the turn automatically if each player has only 1 card left
        await this._handleAutoPlayLastCards({ message, game, scene, reply });
    }

    async _handleAutoPlayLastCards({ message, game, scene, reply }) {
        // Resolves the turn automatically if each player has only 1 card left
        if (this.hands[this.players[0].id].length === 1) {
            let turnPromises = this.players.map(async (player) => {
                await this.playCard(player, 0, { message, scene, game, reply })
            });

            return await Promise.all(turnPromises);
        }
    }

    async playCard({ from, message, scene, game, reply }) {
        let cardIdx = message.text.split(' ').slice(1).join('');
        cardIdx = parseInt(cardIdx);

        return await this.playCard(from, cardIdx, { message, scene, game, reply });
    }

    async playCard(player, cardIdx, { scene, game, reply }) {
        let turnPlayer = this.players[this.turnPlayerIdx];
        if (player.id != turnPlayer.id) return await reply(`It's not your turn to play!`);
        if (!Number.isInteger(cardIdx)) return await reply('Please, enter a valid card index.');
        return await this._placeCard(turnPlayer, cardIdx, { scene, game, reply });
    }

    async _placeCard(player, cardIdx, { scene, game, reply }) {
        if (cardIdx >= this.hands[player.id].length) return await reply('Please, enter a valid card index.');

        // Removes card from player hand and places it on the pile of turn cards
        let [cardPlayed] = this.hands[player.id].splice(cardIdx, 1);
        this.turnCards[player.id] = cardPlayed;
        await reply(`${player.first_name} played a ${cardPlayed.rank} of ${cardPlayed.suit}.`);

        this.turnPlayerIdx += 1;
        if (this.turnPlayerIdx >= this.players.length) {
            await this._evaluateTurnCards({ game, reply });

            let firstPlayerCards = this.hands[this.players[0].id];
            if (firstPlayerCards.length === 0) {
                await game.gameManager.endRound(game.betManager.bets, this.roundScores, { scene, game, reply });
            }
            else {
                await reply(`Starting a new turn.`)
                await this.startTurn({ reply });
            }
        }
        else {
            let nextPlayer = this.players[this.turnPlayerIdx];
            await reply(`Now it's ${nextPlayer.first_name}'s time to play.`);
        }
    }

    async _evaluateTurnCards({ game, reply }) {
        const playedCards = Object.values(this.turnCards);
        const trumpCard = game.gameManager.trumpCard;
        const winnerCard = game.gameManager.deck.evaluateCards(playedCards, trumpCard);

        let turnWinner = null;
        if (winnerCard) {
            const winnerId = Object.keys(this.turnCards).find(key => this.turnCards[key] == winnerCard);
            turnWinner = this.players.find(player => player.id == winnerId);
            await reply(`${turnWinner.first_name} wins with a ${winnerCard.rank} of ${winnerCard.suit}.`);
        }
        else {
            turnWinner = this.cardServer;
            await reply(`All cards were spoiled! ${this.cardServer.first_name} wins this round.`)
        }

        this.roundScores[turnWinner.id] += 1;
        this.players = reorderPlayers(this.players, turnWinner);
        await this.listRoundScore({ reply });
    }

    async listRoundScore({ reply }) {
        let msg = 'Round score:\n';

        Object.keys(this.roundScores).forEach(key => {
            const roundPlayer = this.players.find(player => player.id == key);
            const playerScore = this.roundScores[key];
            msg += `${roundPlayer.first_name} - ${playerScore}\n`;
        });

        await reply(msg);
    }

}