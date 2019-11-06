const { Ranks, Suits } = require('./types');

module.exports = class CardStickerManager {

    constructor() {
        this.stickers = null;
    }

    async getCardSticker(card, { telegram }) {
        this.stickers = this.stickers || await this._buildStickerSet({ telegram });
        return this.stickers[card.suit][card.rank];
    }

    async _buildStickerSet({ telegram }) {
        const cardsPerSuit = 10;
        const stickerSet = await telegram.getStickerSet('FodinhaBot');
        const stickerList = stickerSet.stickers;

        const suitOrderInSet = [Suits.CLUBS, Suits.DIAMONDS, Suits.SPADES, Suits.HEARTS];
        return suitOrderInSet.reduce((setObj, val, idx) => {
            const currentSuit = Object.keys(Suits).find(key => Suits[key] === val);
            const suitCards = stickerList.slice(idx * cardsPerSuit, idx * cardsPerSuit + cardsPerSuit);
            setObj[currentSuit] = {};

            Object.keys(Ranks).forEach((key, idx) => {
                setObj[currentSuit][key] = suitCards[idx];
            });
            return setObj;
        }, {});
    }

}