// Initialize a standard deck of cards
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const deck = [];

for (const suit of suits) {
    for (const value of values) {
        deck.push({ suit, value });
    }
}



// Shuffle the deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    console.log(deck);
}

// Deal two cards to each player
function dealInitialHands(players) {
    for (const player of players) {
        player.hand = [deck.pop(), deck.pop()];
        console.log("player hand", player.hand);
    }
}

// Simulate a round of betting
function bettingRound(players) {
    // Implement your betting logic here
}

// Determine the winner based on hand strength
function determineWinner(players) {
    // Implement your hand evaluation logic here
}

// Main game logic
function playPoker() {
    shuffleDeck(deck);

    const players = [
        { name: "Player 1", hand: [] },
        { name: "Player 2", hand: [] },
        // Add more players as needed
    ];

    dealInitialHands(players);

    // Simulate betting rounds
    bettingRound(players);

    // Determine the winner
    const winner = determineWinner(players);

    return winner;
}

// Example usage
const winner = playPoker();
console.log("Winner:", winner.name);
