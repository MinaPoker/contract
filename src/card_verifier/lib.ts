import { Field, PublicKey, Poseidon, MerkleMap } from 'o1js';
import { Vote } from './sequencer';

export { Nullifier, calculateNullifierRootTransition, calculateVotes, verifyNullifierRoot };

// Calculate the nullifier hash for a Mina Poker game
function Nullifier(publicKey: PublicKey, proposalId: Field) {
  return Poseidon.hash(publicKey.toFields().concat(proposalId));
}

// Calculate the nullifier root transition for Mina Poker
function calculateNullifierRootTransition(
  nullifierTree: MerkleMap,
  votes: Vote[]
) {
  // Get the root of the nullifier tree before processing votes
  const rootBefore = nullifierTree.getRoot();

  // Update the nullifier tree with each vote
  votes.forEach((v) => {
    const key = Nullifier(v.voter, v.proposalId);
    nullifierTree.set(key, Field(1)); // Assuming Field(1) represents a vote
  });

  // Get the root of the nullifier tree after processing votes
  const rootAfter = nullifierTree.getRoot();

  return {
    rootBefore,
    rootAfter,
  };
}

// Calculate the aggregated votes for Mina Poker
function calculateVotes(votes: Vote[]) {
  let yes = Field(0);
  let no = Field(0);
  let abstained = Field(0);

  // Aggregate votes
  votes.forEach((v) => {
    yes = yes.add(v.yes);
    no = no.add(v.no);
    abstained = abstained.add(v.abstained);
  });

  return {
    yes,
    no,
    abstained,
  };
}

// Verify nullifier root after processing votes
function verifyNullifierRoot(rootBefore: Field, rootAfter: Field): boolean {
  // Check if the roots match
  return rootBefore.equals(rootAfter).toBoolean();
}
