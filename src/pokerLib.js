export { deck, cardValues, evaluateHand, findWinner, bettingRound };

// Initialize a standard deck of cards
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const deck = [];

for (const suit of suits) {
    for (const value of values) {
        deck.push({ suit, value });
    }
}

// Define card values for comparison
const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

// Evaluate a poker hand to determine its strength and type
function evaluateHand(hand) {
    const valuesCount = {};
    const suitsCount = {};
    let hasStraight = false;
    let hasFlush = false;

    for (const card of hand) {
        // Count the number of occurrences of each card value and suit
        valuesCount[card.value] = (valuesCount[card.value] || 0) + 1;
        suitsCount[card.suit] = (suitsCount[card.suit] || 0) + 1;
    }

    // Check for flush (five cards of the same suit)
    for (const suit in suitsCount) {
        if (suitsCount[suit] >= 5) {
            hasFlush = true;
            break;
        }
    }

    // Check for straight (five consecutive card values)
    const sortedCardValues = Object.keys(valuesCount).sort((a, b) => cardValues[a] - cardValues[b]);
    for (let i = 0; i < sortedCardValues.length - 4; i++) {
        if (cardValues[sortedCardValues[i + 4]] - cardValues[sortedCardValues[i]] === 4) {
            hasStraight = true;
            break;
        }
    }

    if (hasFlush && hasStraight) {
        return { strength: 9, type: 'Straight Flush' };
    }

    // Check for four of a kind
    for (const value in valuesCount) {
        if (valuesCount[value] === 4) {
            return { strength: 8, type: 'Four of a Kind' };
        }
    }

    // Check for full house (three of a kind and a pair)
    let hasThreeOfAKind = false;
    let hasPair = false;
    for (const value in valuesCount) {
        if (valuesCount[value] === 3) {
            hasThreeOfAKind = true;
        }
        if (valuesCount[value] === 2) {
            hasPair = true;
        }
    }
    if (hasThreeOfAKind && hasPair) {
        return { strength: 7, type: 'Full House' };
    }

    if (hasFlush) {
        return { strength: 6, type: 'Flush' };
    }

    if (hasStraight) {
        return { strength: 5, type: 'Straight' };
    }

    // Check for three of a kind
    if (hasThreeOfAKind) {
        return { strength: 4, type: 'Three of a Kind' };
    }

    // Check for two pair
    if (Object.values(valuesCount).filter(count => count === 2).length === 2) {
        return { strength: 3, type: 'Two Pair' };
    }

    // Check for one pair
    if (hasPair) {
        return { strength: 2, type: 'One Pair' };
    }

    // High card
    const sortedCardValuesHighCard = sortedCardValues.reverse();
    return { strength: 1, type: 'High Card' };
}


// Compare two hands to find the winner
function findWinner(player1Hand, player2Hand) {
    const player1Strength = evaluateHand(player1Hand);
    const player2Strength = evaluateHand(player2Hand);
    console.log("player1Strength", player1Strength, "player2Strength", player2Strength);

    if (player1Strength > player2Strength) {
        return 'Player 1 wins!';
    } else if (player1Strength < player2Strength) {
        return 'Player 2 wins!';
    } else {
        // Compare individual card ranks starting from the highest

        const player1CardValues = player1Hand.map(card => cardValues[card.value]);
        const player2CardValues = player2Hand.map(card => cardValues[card.value]);

        // Sort card values in descending order
        player1CardValues.sort((a, b) => b - a);
        player2CardValues.sort((a, b) => b - a);

        for (let i = 0; i < player1CardValues.length; i++) {
            if (player1CardValues[i] > player2CardValues[i]) {
                return 'Player 1 wins!';
            } else if (player1CardValues[i] < player2CardValues[i]) {
                return 'Player 2 wins!';
            }
        }
        // If all card values are equal, it's a tie
        return 'Tie';
    }
}

// Simulate a round of betting
function bettingRound(players, currentBet) {
    let activePlayers = players.filter(player => !player.isFolded);

    for (let i = 0; i < activePlayers.length; i++) {
        const currentPlayer = activePlayers[i];

        // Simulate player actions (replace with your betting logic)
        const action = simulatePlayerAction(currentPlayer);

        if (action === 'fold') {
            currentPlayer.isFolded = true;
        } else if (action === 'bet') {
            const betAmount = simulateBetAmount(currentPlayer);
            if (betAmount > currentPlayer.chips) {
                // Player doesn't have enough chips to bet, so they go all-in.
                currentPlayer.currentBet += currentPlayer.chips;
                currentPlayer.chips = 0;
            } else {
                currentPlayer.currentBet += betAmount;
                currentPlayer.chips -= betAmount;
            }
        }

        else if (action === 'call') {
            const callAmount = currentBet - currentPlayer.currentBet;
            if (callAmount > currentPlayer.chips) {
                // Player doesn't have enough chips to call, so they go all-in.
                currentPlayer.currentBet += currentPlayer.chips;
                currentPlayer.chips = 0;
            } else {
                currentPlayer.currentBet += callAmount;
                currentPlayer.chips -= callAmount;
            }
        } else if (action === 'raise') {
            const raiseAmount = simulateRaiseAmount(currentPlayer);
            if (raiseAmount > currentPlayer.chips) {
                // Player doesn't have enough chips to raise, so they go all-in.
                currentPlayer.currentBet += currentPlayer.chips;
                currentPlayer.chips = 0;
            } else {
                currentPlayer.currentBet += raiseAmount;
                currentPlayer.chips -= raiseAmount;
            }
        }
    }
}


// Simulated function for player actions
function simulatePlayerAction(player) {
    // Replace this with your own logic for player actions (fold, bet, call, raise)
    const actions = ['fold', 'bet', 'call', 'raise'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    console.log("randomAction :", randomAction)
    return randomAction;
}

// Simulated function for bet amount
function simulateBetAmount(player) {
    // Replace this with your own logic for determining bet amount
    // For simplicity, I'm using a random amount between 1 and 50
    return Math.floor(Math.random() * 50) + 1;
}

// Simulated function for raise amount
function simulateRaiseAmount(player) {
    // Replace this with your own logic for determining raise amount
    // For simplicity, I'm using a random amount between 1 and 50
    return Math.floor(Math.random() * 50) + 1;
}
