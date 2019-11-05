const Ranks = {
    FOUR: 1,
    FIVE: 2,
    SIX: 3,
    SEVEN: 4,
    JACK: 5,
    QUEEN: 6,
    KING: 7,
    ACE: 8,
    TWO: 9,
    THREE: 10,
}

const Suits = {
    DIAMONDS: 1,
    SPADES: 2,
    HEARTS: 3,
    CLUBS: 4,
}

Object.freeze(Ranks);
Object.freeze(Suits);


exports.Ranks = Ranks;
exports.Suits = Suits;