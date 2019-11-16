const GameManager = require('../game/managers/game');

const mockUsers = [
    { id: 1, first_name: 'Paiva1', },
    { id: 2, first_name: 'Paiva2', },
    { id: 3, first_name: 'Paiva3', },
    { id: 4, first_name: 'Paiva4', },
    { id: 5, first_name: 'Paiva5', },
    { id: 6, first_name: 'Paiva6', },
    { id: 7, first_name: 'Paiva7', },
];

let mockReply;
let mockDb;
let mockScene;
let mockSession;

let gameManager;

beforeEach(() => {
    mockReply = jest.fn();
    mockDb = {};
    mockScene = {
        enter: jest.fn(),
    };
    mockSession = {
        lobby: {
            players: [...mockUsers]
        }
    };

    gameManager = new GameManager({ db: mockDb, session: mockSession, scene: mockScene });
});


// TODO: Test player reordering on turn end
// TODO: Test end game conditions
// TODO: Test win conditions
// TODO: Test lose conditions