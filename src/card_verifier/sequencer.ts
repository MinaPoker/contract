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

class CardData extends Struct({
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


class Vote extends Struct({
    voter: PublicKey,
    authorization: Signature,
    voterDataRoot: Field,
    proposalId: Field,
    yes: Field,
    no: Field,
    abstained: Field,
}) {
    fromJSON(json: JSONVote): Vote {
        return new Vote({
            voter: PublicKey.fromBase58(json.voter),
            authorization: Signature.fromJSON(json.authorization),
            voterDataRoot: Field(this.voterDataRoot),
            yes: Field(json.yes),
            no: Field(json.no),
            abstained: Field(json.abstained),
            proposalId: Field(json.proposalId),
        });
    }

    verifySignature(publicKey: PublicKey) {
        return this.authorization.verify(publicKey, [
            this.yes,
            this.no,
            this.abstained,
            this.proposalId,
            this.voterDataRoot,
        ]);
    }
}

// just a tiny helper function
function MerkleMapExtended<
    V extends {
        hash(): Field;
        toJSON(): any;
    }
>() {
    let merkleMap = new MerkleMap();
    let map = new Map<string, V>();

    return {
        get(key: Field): V {
            return map.get(key.toString())!;
        },
        set(key: Field, value: V) {
            map.set(key.toString(), value);
            merkleMap.set(key, value.hash());
        },
        getRoot(): Field {
            return merkleMap.getRoot();
        },
        getWitness(key: Field): MerkleMapWitness {
            return merkleMap.getWitness(key);
        },
        flat() {
            let leaves = [...map.keys()].map((key, i) => {
                let entry = map.get(key)!;
                return {
                    i,
                    key,
                    data: { ...entry.toJSON(), hash: entry.hash().toString() },
                };
            });
            return {
                meta: {
                    root: merkleMap.getRoot().toString(),
                    height: merkleMap.tree.height.toString(),
                    leafCount: merkleMap.tree.leafCount.toString(),
                },
                leaves,
            };
        },
    };
}

const PORT = 3000;