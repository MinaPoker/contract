
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