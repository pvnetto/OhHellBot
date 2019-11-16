const { reorderPlayers } = require('../utils');
const { States } = require('./states');
const DrawManager = require('../draw');

module.exports = class GameManager {

    constructor({ db, session, scene }) {
        // Match parameters
        this.players = [...session.lobby.players];
        this.startPlayers = [...this.players];
        this.owner = Object.assign({}, session.lobby.owner);
        this.scene = scene;
        this.currentState = States.DRAW;

        // Adds a reference for this to each player
        this.players.forEach(player => db[player.id].gameManager = this);

        // Game State variables
        this.roundCount = 1;
        this.strikes = this.players.reduce((newObj, player) => {
            newObj[player.id] = 0;
            return newObj;
        }, {});

        // Draw variables
        this.drawManager = new DrawManager(this.players);
    }

    // Delegating draw manager methods
    get trumpCard() { return this.drawManager.currentTrump; }
    get cardsToDraw() { return this.drawManager.cardsToDraw; }
    get hands() { return this.drawManager.hands };

    async distributeCards({ stickerManager, session, telegram }) {
        this.drawManager.distributeCards(this.players, this.roundCount, { stickerManager, session, telegram });
        await this.drawManager.sendRoundStartMessage(this.players[0], this.roundCount, { stickerManager, session, telegram });
    }

    get isGameOver() { return this.players.length <= 1; }

    async switchState(newState) {
        switch (newState) {
            case States.DRAW:
                this.currentState = States.DRAW;
                await this.scene.enter('draw');
                break;
            case States.BET:
                this.currentState = States.BET;
                await this.scene.enter('bets');
                break;
            case States.ROUND:
                this.currentState = States.ROUND;
                await this.scene.enter('round');
                break;
            default:
                break;
        }
    }

    async getInlineQueryOptions({ stickerManager, from, inlineQuery, db, telegram }) {
        const userDb = db[from.id];

        if (this.currentState === States.BET && userDb.betManager) {
            return await userDb.betManager.getBetInlineQueryOptions(this.drawManager.hands, { stickerManager, from, inlineQuery, telegram });
        }
        else if (this.currentState === States.ROUND && userDb.roundManager) {
            return await userDb.roundManager.getPlayerInlineQueryOptions({ stickerManager, from, telegram });
        }
        return [];
    }

    async endRound(bets, roundScores, { db, session, telegram }) {
        await this.resolveRound(bets, roundScores, { session, telegram });

        // Checks if match has ended
        if (this.isGameOver) {
            await this.handleGameOver({ db, session, telegram });
        }
        else {
            await this.handleNextRound();
            await this.switchState(States.DRAW);
        }
    }

    async handleGameOver({ db, session, telegram }) {
        if (this.isGameOver) {
            // Checks if match has ended
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
    }

    handleNextRound() {
        this.players = reorderPlayers(this.players, this.players[1]);
        this.roundCount += 1;
        this.drawManager.handleCardsToDrawIncrement();
    }

    async resolveRound(bets, roundScores, { session, telegram }) {
        let roundMsg = `*End of round #${this.roundCount}*\n`;
        this.startPlayers.forEach((currentPlayer) => {
            if (this.players.includes(currentPlayer)) {
                const strikesMsg = this.handlePlayerStrikes(currentPlayer, bets[currentPlayer.id], roundScores[currentPlayer.id]);
                roundMsg += strikesMsg;
            }
            else {
                roundMsg += `${currentPlayer.first_name} - Eliminated.\n`;
            }
        });

        await telegram.sendMessage(session.lobby.groupId, roundMsg, { parse_mode: 'markdown' });
    }

    handlePlayerStrikes(player, bet, roundScore) {
        let strikeCount = Math.abs(bet - roundScore);
        this.strikes[player.id] += strikeCount;

        const currentPlayerStrikes = this.strikes[player.id];
        const isEliminated = currentPlayerStrikes >= 5;

        this.players = this.players.filter(player => this.strikes[player.id] < 5);

        return `[${player.first_name}](tg://user?id=${player.id}) - Strikes: ${strikeCount} | `
            + `Total: ${currentPlayerStrikes} ${isEliminated ? '| Eliminated' : ''}\n`;
    }

}