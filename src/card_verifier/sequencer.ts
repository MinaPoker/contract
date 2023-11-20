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

class VoterData extends Struct({
    publicKey: PublicKey,
    weight: Field,
}) {
    hash(): Field {
        return Poseidon.hash(this.publicKey.toFields().concat(this.weight));
    }

    toJSON() {
        return {
            publicKey: this.publicKey.toBase58(),
            weight: this.weight.toString(),
        };
    }
}

type JSONVote = {
    voter: string;
    authorization: {
        r: string;
        s: string;
    };
    voterDataRoot: string;
    yes: string;
    no: string;
    abstained: string;
    proposalId: string;
};

function validateJSONVote(json: unknown): json is JSONVote {
    // this is very sloppy
    return (
        typeof json === 'object' &&
        json !== null &&
        'voter' in json &&
        'authorization' in json &&
        'voterDataRoot' in json &&
        'choice' in json &&
        'proposalId' in json
    );
}

