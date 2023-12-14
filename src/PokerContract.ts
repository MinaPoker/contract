import {
    SmartContract,
    method,
    state,
    Field,
    Poseidon,
    Bool,
    State,
    Struct,
    Provable,
    PublicKey,
    PrivateKey,
    Signature,
} from 'o1js';

export { PokerGame, cardOwnershipVerify };

class Player extends Struct({
    publicKey: PublicKey,
    chips: Field,
    currentBet: Field,
    isFolded: Bool,
    handStrength: Field,
    betAmount: Field,
}) {
    // assign() {
    //     this.publicKey = this.userVotes.add(1)
    // };
}

class cardOwnershipVerify extends Struct({
    publicKey: PublicKey,
    suit: Field,
    rank: Field,
    signature: Signature,
}) {
    verifyOwnership() {
        let message = this.signature.verify(this.publicKey, [this.suit, this.rank]);
        // let playerCards = this.playerCards.getAndAssertExists();
        // let isOwner = playerCards.some((c) => c.suit.equals(card.suit) && c.rank.equals(card.rank));
        // let isOwner = this.publicKey.verify(message, this.signature);
        message.assertTrue('You do not own this card.');
    }
}

class PokerGame extends SmartContract {
    // @state(Field) numPlayers = State<Field>();
    @state(Field) potAmount = State<Field>();
    @state(Field) winner = State<Field>();

    @state(Bool) nextIsPlayer2 = State<Bool>();
    // defaults to false, set to true when a player wins

    @state(Bool) gameDone = State<Bool>();
    // the two players who are allowed to play

    @state(Player)
    player1 = State<Player[]>();

    @state(Player)
    player2 = State<Player[]>();

    // init() {
    //     super.init();
    //     this.gameDone.set(Bool(true));
    //     this.player1.publicKey.set(PublicKey.empty());
    //     this.player2.set(PublicKey.empty());
    // }

    @method assignPlayers(player1: Player, player2: Player) {
        this.gameDone.assertEquals(Bool(true));

        // set players
        this.player1.set(player1);
        this.player2.set(player2);
    }

    @method
    bet(amount: Field) {
        let player = this.getPlayerByAddress(this.context.sender);
        player.betAmount = player.betAmount.add(amount);
        this.potAmount = this.potAmount.add(amount);
    }

    @method
    revealHand(hand: Card[]) {
        let player = this.getPlayerByAddress(this.context.sender);
        player.hand = hand;

        // Additional logic for revealing hands and determining winners can be added here

        // For simplicity, let's assume the winner takes the entire pot
        this.send({ to: this.context.sender, amount: this.potAmount });
        this.potAmount = Field.from(0);
    }

    private getPlayerByAddress(address: Field): Player {
        let player = this.players.find((p) => p.address.equals(address));

        if (!player) {
            // Handle error or return default player structure
        }

        return player;
    }
}