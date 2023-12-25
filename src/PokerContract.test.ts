import { PokerGame, cardOwnershipVerify } from './PokerContract';
import {
    Field,
    Bool,
    PrivateKey,
    PublicKey,
    Mina,
    AccountUpdate,
    Signature,
} from 'o1js';
import { deck, cardValues, evaluateHand, findWinner, bettingRound } from './pokerLib'


let proofsEnabled = false;

// define type player
type Player = {
    name: PublicKey;
    chips: number;
    currentBet: number;
    isFolded: boolean;
    handStrength: number;
    betAmount: number;
}

// define type card
type Card = {
    suit: string;
    value: string;
}

function createGamePlayer(player1Add: PublicKey, player2Add: PublicKey): Player[] {
    // creating game for 2 players

    // distributing cards to 2 players
    const player1Hand: Card[] = [
        { suit: 'Hearts', value: 'A' },
        { suit: 'Hearts', value: 'K' },
    ];

    const player2Hand: Card[] = [
        { suit: 'Hearts', value: 'A' },
        { suit: 'Clubs', value: 'A' },
    ];


    function calculateHandStrength(handCard: Card[]) {
        const handStrength = evaluateHand(handCard);
        return handStrength;
    }

    const player1: Player = { name: player1Add, chips: 100, currentBet: 10, isFolded: false, handStrength: calculateHandStrength(player1Hand), betAmount: 0 };
    const player2: Player = { name: player2Add, chips: 100, currentBet: 20, isFolded: false, handStrength: calculateHandStrength(player2Hand), betAmount: 0 };

    const player: Player[] = [player1, player2];
    console.log("Player", player);
    return player;

}

describe('poker', () => {
    let player1Add: PublicKey,
        player1Key: PrivateKey,
        player2Add: PublicKey,
        zkAppAddress: PublicKey,
        zkAppPrivateKey: PrivateKey;
    let players: Player[] = [];

    beforeEach(async () => {
        let Local = Mina.LocalBlockchain({ proofsEnabled: false });
        Mina.setActiveInstance(Local);
        const [{ publicKey: player1Add, privateKey: player1Key }, { publicKey: player2Add }] = Local.testAccounts;
        zkAppPrivateKey = PrivateKey.random();
        zkAppAddress = zkAppPrivateKey.toPublicKey();
        players = createGamePlayer(player1Add, player2Add);
        console.log("players in poker", players);
    });

    it('generates and create poker game', async () => {
        const zkApp = new PokerGame(zkAppAddress);
        const txn = await Mina.transaction(player1Add, () => {
            AccountUpdate.fundNewAccount(player1Add);
            zkApp.deploy();
            zkApp.startGame(player1Add, player2Add);
        });
        await txn.prove();
        await txn.sign([zkAppPrivateKey, player1Key]).send();
        const board = zkApp.board.get();
        expect(board).toEqual(Field(0));
    });

    it('should allow players to bet', async () => {
        const zkApp = new PokerGame(zkAppAddress);
        const txn = await Mina.transaction(player1Add, () => {
            AccountUpdate.fundNewAccount(player1Add);
            zkApp.deploy();
            zkApp.startGame(player1Add, player2Add);
            zkApp.bet(Field.from(10));
        });
        await txn.prove();
        await txn.sign([zkAppPrivateKey, player1Key]).send();

        const player1 = await zkApp.getPlayerByAddress(player1Add);
        expect(player1.betAmount).toEqual(Field.from(10));
    });



    it('should reveal hands and determine winners', async () => {
        const zkApp = new PokerGame(zkAppAddress);

        const hand: Card[] = [
            { suit: 'Hearts', value: 'A' },
            { suit: 'Hearts', value: 'K' },
            // Add more cards based on your game rules
        ];

        const txn = await Mina.transaction(player1Add, () => {
            AccountUpdate.fundNewAccount(player1Add);
            zkApp.deploy();
            zkApp.startGame(player1Add, player2Add);
            zkApp.bet(Field.from(10));
            zkApp.revealHand(hand);
        });
        await txn.prove();
        await txn.sign([zkAppPrivateKey, player1Key]).send();

        const winner = zkApp.winner.get();
        expect(winner).toEqual(player1Add);
    });

    it('should handle folding', async () => {
        const zkApp = new PokerGame(zkAppAddress);
        const txn = await Mina.transaction(player1Add, () => {
            AccountUpdate.fundNewAccount(player1Add);
            zkApp.deploy();
            zkApp.startGame(player1Add, player2Add);
            zkApp.fold();
        });
        await txn.prove();
        await txn.sign([zkAppPrivateKey, player1Key]).send();

        const player1 = await zkApp.getPlayerByAddress(player1Add);
        expect(player1.isFolded).toEqual(Bool(true));
    });

    it('should determine the correct winner', async () => {
        const zkApp = new PokerGame(zkAppAddress);
        const txn = await Mina.transaction(player1Add, () => {
            AccountUpdate.fundNewAccount(player1Add);
            zkApp.deploy();
            zkApp.startGame(player1Add, player2Add);
            zkApp.bet(Field.from(10));
            zkApp.bet(Field.from(20));
        });
        await txn.prove();
        await txn.sign([zkAppPrivateKey, player1Key]).send();

        const winner = zkApp.winner.get();
        // Assert the correct winner based on your game logic
    });

    it('should handle multiple rounds of betting', async () => {
        const zkApp = new PokerGame(zkAppAddress);
        const txn = await Mina.transaction(player1Add, () => {
            AccountUpdate.fundNewAccount(player1Add);
            zkApp.deploy();
            zkApp.startGame(player1Add, player2Add);
            zkApp.bet(Field.from(10));
            zkApp.bet(Field.from(20));
            zkApp.raise(Field.from(30));
            zkApp.call();
        });
        await txn.prove();
        await txn.sign([zkAppPrivateKey, player1Key]).send();

    });

    it('should handle ties and split the pot', async () => {
        const zkApp = new PokerGame(zkAppAddress);
        const txn = await Mina.transaction(player1Add, () => {
            AccountUpdate.fundNewAccount(player1Add);
            zkApp.deploy();
            zkApp.startGame(player1Add, player2Add);
            zkApp.bet(Field.from(10));
            zkApp.bet(Field.from(10)); // Player 2 bets the same amount
            // Add logic for revealing hands leading to a tie
            // ...
        });
        await txn.prove();
        await txn.sign([zkAppPrivateKey, player1Key]).send();

        const potAmount = zkApp.potAmount.get();
        // Assert that the pot is split between players
        expect(potAmount).toEqual(Field.from(20));
    });

    // it('generates and deploys tictactoe', async () => {
    //     const zkApp = new PokerGame(zkAppAddress);
    //     const txn = await Mina.transaction(player1Add, () => {
    //         AccountUpdate.fundNewAccount(player1Add);
    //         zkApp.deploy();
    //         zkApp.startGame(player1Add, player2Add);
    //     });
    //     await txn.prove();
    //     await txn.sign([zkAppPrivateKey, player1Key]).send();
    //     const board = zkApp.board.get();
    //     expect(board).toEqual(Field(0));
    // });

    // it('deploys tictactoe & accepts a correct move', async () => {
    //     const zkApp = new TicTacToe(zkAppAddress);

    //     // deploy
    //     let txn = await Mina.transaction(player1, () => {
    //         AccountUpdate.fundNewAccount(player1);
    //         zkApp.deploy();
    //         zkApp.startGame(player1, player2);
    //     });
    //     await txn.prove();
    //     await txn.sign([zkAppPrivateKey, player1Key]).send();

    //     // move
    //     const [x, y] = [Field(0), Field(0)];
    //     const signature = Signature.create(player1Key, [x, y]);
    //     txn = await Mina.transaction(player1, async () => {
    //         zkApp.play(player1, signature, x, y);
    //     });
    //     await txn.prove();
    //     await txn.sign([player1Key]).send();

    //     // check next player
    //     let isNextPlayer2 = zkApp.nextIsPlayer2.get();
    //     expect(isNextPlayer2).toEqual(Bool(true));
    // });
});
