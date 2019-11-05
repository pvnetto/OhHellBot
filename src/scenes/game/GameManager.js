const CardsDeck = require('./cards/CardsDeck');
const { reorderPlayers } = require('./utils');

module.exports = class GameManager {

    constructor(lobby) {
        // Match parameters
        this.players = [...lobby.players];
        this.startPlayers = [...this.players];
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
        this.maxDraw = Math.min(Math.floor((this.deck.maxDeckSize - 1) / this.players.length), 7);
        this.reachedMaxDraw = false;
        this.hands = {};

        // Binding methods
        this.distributeCards.bind(this);
        this._handleCardMessages.bind(this);
        this._sendMessageWithOpponentCards.bind(this);
        this._sendMessageWithPlayerCards.bind(this);
        this.endRound.bind(this);
        this._resolveRound.bind(this);
        this._handleCardsToDrawIncrement.bind(this);
    }

    get trumpCard() { return this._currentTrump; }

    async distributeCards({ lobby, telegram }) {

        let firstPlayer = this.players[0];

        this.deck.reset();
        this.deck.shuffle();
        const { drawn, trump } = this.deck.drawTrumpCard();
        this._currentTrump = trump;

        this.players.forEach(player => {
            this.hands[player.id] = this.deck.drawCards(this.cardsToDraw);
        });

        await this._handleCardMessages(telegram);
        await this._sendCardPhoto(lobby.groupId, this._currentTrump,
            `*Round #${this.roundCount}.*\n${firstPlayer.first_name} shuffles the deck, `
            + `draws a ${drawn.rank} of ${drawn.suit} from the top of the deck and deals ${this.cardsToDraw} `
            + `card${this.cardsToDraw > 1 ? 's' : ''} for each player.`
            + `\nThe trump card for this round is ${this._currentTrump.rank} of ${this._currentTrump.suit}.`,
            { telegram });
    }

    async _handleCardMessages(telegram) {
        if (this.roundCount === 1) {
            await this._sendMessageWithOpponentCards(telegram);
        }
        else {
            await this._sendMessageWithPlayerCards(telegram);
        }
    }

    async _sendMessageWithPlayerCards(telegram) {
        let msgPromises = this.players.map(async (player) => {
            await telegram.sendMessage(player.id, "Your cards for this turn: \n");

            let photoPromises = this.hands[player.id].map(async (playerCard, idx) => {
                await this._sendCardPhoto(player.id, playerCard, `${idx} - ${playerCard.rank} of ${playerCard.suit}`, { telegram })
            });
            await Promise.all(photoPromises);
        });

        await Promise.all(msgPromises);
    }

    async _sendMessageWithOpponentCards(telegram) {
        if (this.roundCount === 1) {
            let msgPromises = this.players.map(async (player) => {
                await telegram.sendMessage(player.id, "Your opponents cards for this turn: \n");

                let photoPromises = Object.keys(this.hands).map(async (id) => {
                    if (id != player.id) {
                        let opponentCard = this.hands[id][0];
                        let opponent = this.players.find(opponent => opponent.id == id);
                        await this._sendCardPhoto(player.id, opponentCard, `${opponent.first_name}'s card`, { telegrm });
                    }
                });
                await Promise.all(photoPromises);
            });

            await Promise.all(msgPromises);
        }
    }

    async _sendCardPhoto(id, card, caption, { telegram }) {
        const cardURL = __dirname + `/cards/images/${card.rank}_${card.suit}.png`;
        await telegram.sendPhoto(id, { source: cardURL }, { caption, parse_mode: 'markdown' });
    }

    async endRound(bets, roundScores, { scene, lobby, game, telegram }) {

        await this._resolveRound(bets, roundScores, { lobby, telegram });

        // Checks if match has ended
        // if (this.players.length <= 1) {
        //     if (this.players.length === 1) {
        //         let winner = this.players[0];
        //         await telegram.sendMessage(lobby.groupId, `Game over.\n${winner.first_name} is the winner!`);
        //     }
        //     else {
        //         await telegram.sendMessage(lobby.groupId, 'Game over.\nIt's a draw!');
        //     }

        //     game.gameManager = null;
        //     await scene.enter('greeter');
        // }
        // else {
        //     this.players = reorderPlayers(this.players, this.players[1]);
        //     this.roundCount += 1;
        //     this._handleCardsToDrawIncrement();
        //     await scene.enter('bets');
        // }

        this.players = reorderPlayers(this.players, this.players[1]);
        this.roundCount += 1;
        this._handleCardsToDrawIncrement();

        await scene.enter('bets');
    }

    async _resolveRound(bets, roundScores, { lobby, telegram }) {
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

        await telegram.sendMessage(lobby.groupId, roundMsg, { parse_mode: 'markdown' });
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