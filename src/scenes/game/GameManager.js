const CardsDeck = require('./cards/CardsDeck');
const { reorderPlayers } = require('./utils');

module.exports = class GameManager {

    constructor(lobby) {
        // Match parameters
        this.players = [...lobby.players];
        this.owner = Object.assign({}, lobby.owner);

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
        this.maxDraw = Math.floor((this.deck.maxDeckSize - 1) / this.players.length);
        this.reachedMaxDraw = false;
        this.hands = {};

        // Binding methods
        this.distributeCards.bind(this);
        this._handleCardMessages.bind(this);
        this.endRound.bind(this);
        this._resolveRound.bind(this);
        this._handleCardsToDrawIncrement.bind(this);
    }

    get trumpCard() { return this._currentTrump };

    async distributeCards({ telegram, reply }) {
        let firstPlayer = this.players[0];

        this.deck.shuffle();
        await reply(`${firstPlayer.first_name} is the server for this round.`);

        this._currentTrump = this.deck.drawSingleCard();
        await reply(`The trump for this round is ${this._currentTrump.rank} of ${this._currentTrump.suit}`);

        this.players.forEach(player => {
            this.hands[player.id] = this.deck.drawCards(this.cardsToDraw);
        });

        await this._handleCardMessages(telegram);
        await reply(`The cards were drawn.`);
    }

    async _handleCardMessages(telegram) {
        if (this.roundCount === 1) {
            let msgPromises = this.players.map(async (player) => {
                await telegram.sendMessage(player.id, "Your opponents cards for this turn: \n");

                let photoPromises = Object.keys(this.hands).map(async (id) => {
                    if (id != player.id) {
                        let opponentCard = this.hands[id][0];
                        let opponent = this.players.find(opponent => opponent.id == id);

                        let cardPhoto = __dirname + `/cards/images/${opponentCard.rank}_${opponentCard.suit}.png`;
                        await telegram.sendPhoto(player.id, { source: cardPhoto }, { caption: `${opponent.first_name}'s card` });
                    }
                });
                await Promise.all(photoPromises);
            });

            await Promise.all(msgPromises);
        }
        else {
            let msgPromises = Object.keys(this.hands).map(async (playerId) => {
                let msg = "Your cards for this turn: \n";
                hands[playerId].forEach(card => msg += `${card.rank} of ${card.suit}\n`);
                await telegram.sendMessage(playerId, msg);
            });

            await Promise.all(msgPromises);
        }
    }

    async _sendFirstRoundMessages(telegram) {
        if (this.roundCount === 1) {
            let msgPromises = this.players.map(async (player) => {
                await telegram.sendMessage(player.id, "Your opponents cards for this turn: \n");

                let photoPromises = Object.keys(this.hands).map(async (id) => {
                    if (id != player.id) {
                        let opponentCard = this.hands[id][0];
                        let opponent = this.players.find(opponent => opponent.id == id);

                        let cardPhoto = __dirname + `/cards/images/${opponentCard.rank}_${opponentCard.suit}.png`;
                        await telegram.sendPhoto(player.id, { source: cardPhoto }, { caption: `${opponent.first_name}'s card` });
                    }
                });
                await Promise.all(photoPromises);
            });

            await Promise.all(msgPromises);
        }
    }

    async endRound(bets, roundScores, { scene, game, reply }) {

        await this._resolveRound(bets, roundScores, { reply });

        // Checks if match has ended
        if (this.players.length <= 1) {
            if (this.players.length === 1) {
                let winner = this.players[0];
                await reply(`Game ended! ${winner.first_name} wins!`);
            }
            else {
                await reply('Draw!');
            }

            game.gameManager = null;
            await scene.enter('greeter');
        }
        else {
            this.players = reorderPlayers(this.players, this.players[1]);
            this.roundCount += 1;
            this._handleCardsToDrawIncrement();
        }

        game.betManager = null;
    }

    async _resolveRound(bets, roundScores, { reply }) {
        let roundPromises = Object.keys(bets).map(async (key) => {
            let strikeCount = Math.abs(bets[key] - roundScores[key]);
            let currentPlayer = this.players.find(player => player.id == key);
            this.strikes[key] += strikeCount;
            await reply(`${currentPlayer.first_name} got ${strikeCount} strikes this round.`);

            let currentPlayerStrikes = this.strikes[key];
            if (currentPlayerStrikes >= 5) {
                // Announces if someone was eliminated
                let eliminatedIdx = this.players.findIndex(player => player.id == key);
                let [eliminatedPlayer] = this.players.splice(eliminatedIdx, 1);
                await reply(`${eliminatedPlayer.first_name} is eliminated with ${currentPlayerStrikes} strikes.`)
            }
        });

        await Promise.all(roundPromises);
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