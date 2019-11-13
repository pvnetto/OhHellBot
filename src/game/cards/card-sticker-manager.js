const { Ranks, Suits } = require('./types');
const { Card } = require('./card');

module.exports = class CardStickerManager {

    constructor() {
        this.stickers = null;
    }

    async getStickerByCard(card, { telegram }) {
        this.stickers = this.stickers || await this._buildStickerSet({ telegram });
        return this.stickers[card.suit][card.rank];
    }

    async getCardBySticker(sticker, { telegram }) {
        this.stickers = this.stickers || await this._buildStickerSet({ telegram });
        const stickerId = sticker.file_id;

        const suitKeys = Object.keys(Suits);
        const rankKeys = Object.keys(Ranks);

        for (let i = 0; i < suitKeys.length; i++) {
            for (let j = 0; j < rankKeys.length; j++) {
                const suit = suitKeys[i];
                const rank = rankKeys[j];
                const currentStickerId = this.stickers[suit][rank].file_id;
                if (stickerId == currentStickerId) {
                    return new Card(rank, suit);
                }
            }
        }

        return null;
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