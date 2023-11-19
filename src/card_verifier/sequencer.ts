import {
    PublicKey,
    Struct,
    Field,
    MerkleMap,
    Signature,
    UInt32,
    MerkleMapWitness,
    Poseidon,
    isReady,
    PrivateKey,
} from 'snarkyjs';

import express from 'express';

export {
    CardData,
    Vote,
    Proposal,
    StateTransition,
    VotingPeriod,
    Voting,
    MerkleMapExtended,
};

//await isReady;

class Proposal extends Struct({
    title: String,
    id: Field,
    // we can add as many or as less options as we want
    yes: Field,
    no: Field,
    abstained: Field,
}) { }

class StateTransition extends Struct({
    CardDataRoot: Field, // this never changes
    nullifier: {
        before: Field,
        after: Field,
    },
    proposalId: Field,
    result: {
        before: {
            yes: Field,
            no: Field,
            abstained: Field,
        },
        after: { yes: Field, no: Field, abstained: Field },
    },
}) { }

class VotingPeriod extends Struct({
    electionPeriod: {
        start: UInt32,
        end: UInt32,
    },
    challengingPeriod: {
        start: UInt32,
        end: UInt32,
    },
}) { }
