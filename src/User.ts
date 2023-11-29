import {
    Field,
    Struct,
    PublicKey,
    Signature,
    Poseidon,
    Experimental,
    SelfProof,
    CircuitString,
    MerkleMapWitness,
} from 'o1js';

// ============================================================================

export const fieldToFlagUsersAsDeleted = Field(93137);
export const fieldToFlagUsersAsRestored = Field(1010);

// ============================================================================

export class Userstate extends Struct({
    posterAddress: PublicKey,
    postContentID: CircuitString,
    allUsersCounter: Field,
    userUsersCounter: Field,
    postBlockHeight: Field,
    deletionBlockHeight: Field,
}) {
    hash(): Field {
        return Poseidon.hash(
            this.posterAddress
                .toFields()
                .concat([
                    this.postContentID.hash(),
                    this.allUsersCounter,
                    this.userUsersCounter,
                    this.postBlockHeight,
                    this.deletionBlockHeight,
                ])
        );
    }
}

// ============================================================================

export class UsersTransition extends Struct({
    initialAllUsersCounter: Field,
    latestAllUsersCounter: Field,
    initialUsersUsersCounters: Field,
    latestUsersUsersCounters: Field,
    initialUsers: Field,
    latestUsers: Field,
    blockHeight: Field,
}) {
    static createPostPublishingTransition(
        signature: Signature,
        initialAllUsersCounter: Field,
        initialUsersUsersCounters: Field,
        latestUsersUsersCounters: Field,
        initialUserUsersCounter: Field,
        userUsersCounterWitness: MerkleMapWitness,
        initialUsers: Field,
        latestUsers: Field,
        Userstate: Userstate,
        postWitness: MerkleMapWitness
    ) {
        initialAllUsersCounter.assertEquals(Userstate.allUsersCounter.sub(1));
        Userstate.deletionBlockHeight.assertEquals(Field(0));

        const isSigned = signature.verify(Userstate.posterAddress, [
            Userstate.postContentID.hash(),
        ]);
        isSigned.assertTrue();

        const [usersUsersCountersBefore, userUsersCounterKey] =
            userUsersCounterWitness.computeRootAndKey(initialUserUsersCounter);
        usersUsersCountersBefore.assertEquals(initialUsersUsersCounters);
        const posterAddressAsField = Poseidon.hash(
            Userstate.posterAddress.toFields()
        );
        userUsersCounterKey.assertEquals(posterAddressAsField);
        initialUserUsersCounter.assertEquals(Userstate.userUsersCounter.sub(1));

        const usersUsersCountersAfter = userUsersCounterWitness.computeRootAndKey(
            Userstate.userUsersCounter
        )[0];
        usersUsersCountersAfter.assertEquals(latestUsersUsersCounters);

        const [UsersBefore, postKey] = postWitness.computeRootAndKey(Field(0));
        UsersBefore.assertEquals(initialUsers);
        postKey.assertEquals(
            Poseidon.hash([posterAddressAsField, Userstate.postContentID.hash()])
        );

        const UsersAfter = postWitness.computeRootAndKey(Userstate.hash())[0];
        UsersAfter.assertEquals(latestUsers);

        return new UsersTransition({
            initialAllUsersCounter: initialAllUsersCounter,
            latestAllUsersCounter: Userstate.allUsersCounter,
            initialUsersUsersCounters: initialUsersUsersCounters,
            latestUsersUsersCounters: usersUsersCountersAfter,
            initialUsers: initialUsers,
            latestUsers: UsersAfter,
            blockHeight: Userstate.postBlockHeight,
        });
    }

    static assertEquals(
        transition1: UsersTransition,
        transition2: UsersTransition
    ) {
        transition1.initialAllUsersCounter.assertEquals(
            transition2.initialAllUsersCounter
        );
        transition1.latestAllUsersCounter.assertEquals(
            transition2.latestAllUsersCounter
        );
        transition1.initialUsersUsersCounters.assertEquals(
            transition2.initialUsersUsersCounters
        );
        transition1.latestUsersUsersCounters.assertEquals(
            transition2.latestUsersUsersCounters
        );
        transition1.initialUsers.assertEquals(transition2.initialUsers);
        transition1.latestUsers.assertEquals(transition2.latestUsers);
        transition1.blockHeight.assertEquals(transition2.blockHeight);
    }

    static mergeUsersTransitions(
        transition1: UsersTransition,
        transition2: UsersTransition
    ) {
        transition1.latestAllUsersCounter.assertEquals(
            transition2.initialAllUsersCounter
        );
        transition1.latestUsersUsersCounters.assertEquals(
            transition2.initialUsersUsersCounters
        );
        transition1.latestUsers.assertEquals(transition2.initialUsers);
        transition1.blockHeight.assertEquals(transition2.blockHeight);

        return new UsersTransition({
            initialAllUsersCounter: transition1.initialAllUsersCounter,
            latestAllUsersCounter: transition2.latestAllUsersCounter,
            initialUsersUsersCounters: transition1.initialUsersUsersCounters,
            latestUsersUsersCounters: transition2.latestUsersUsersCounters,
            initialUsers: transition1.initialUsers,
            latestUsers: transition2.latestUsers,
            blockHeight: transition1.blockHeight,
        });
    }

    static createPostDeletionTransition(
        signature: Signature,
        allUsersCounter: Field,
        usersUsersCounters: Field,
        initialUsers: Field,
        latestUsers: Field,
        initialUserstate: Userstate,
        postWitness: MerkleMapWitness,
        blockHeight: Field
    ) {
        initialUserstate.deletionBlockHeight.assertEquals(Field(0));
        const initialUserstateHash = initialUserstate.hash();
        const isSigned = signature.verify(initialUserstate.posterAddress, [
            initialUserstateHash,
            fieldToFlagUsersAsDeleted,
        ]);
        isSigned.assertTrue();

        const UsersBefore = postWitness.computeRootAndKey(initialUserstateHash)[0];
        UsersBefore.assertEquals(initialUsers);

        const latestUserstate = new Userstate({
            posterAddress: initialUserstate.posterAddress,
            postContentID: initialUserstate.postContentID,
            allUsersCounter: initialUserstate.allUsersCounter,
            userUsersCounter: initialUserstate.userUsersCounter,
            postBlockHeight: initialUserstate.postBlockHeight,
            deletionBlockHeight: blockHeight,
        });

        const UsersAfter = postWitness.computeRootAndKey(latestUserstate.hash())[0];
        UsersAfter.assertEquals(latestUsers);

        return new UsersTransition({
            initialAllUsersCounter: allUsersCounter,
            latestAllUsersCounter: allUsersCounter,
            initialUsersUsersCounters: usersUsersCounters,
            latestUsersUsersCounters: usersUsersCounters,
            initialUsers: initialUsers,
            latestUsers: UsersAfter,
            blockHeight: blockHeight,
        });
    }

    static createPostRestorationTransition(
        signature: Signature,
        allUsersCounter: Field,
        usersUsersCounters: Field,
        initialUsers: Field,
        latestUsers: Field,
        initialUserstate: Userstate,
        postWitness: MerkleMapWitness,
        blockHeight: Field
    ) {
        initialUserstate.deletionBlockHeight.assertNotEquals(0);
        const initialUserstateHash = initialUserstate.hash();
        const isSigned = signature.verify(initialUserstate.posterAddress, [
            initialUserstateHash,
            fieldToFlagUsersAsRestored,
        ]);
        isSigned.assertTrue();

        const UsersBefore = postWitness.computeRootAndKey(initialUserstateHash)[0];
        UsersBefore.assertEquals(initialUsers);

        const latestUserstate = new Userstate({
            posterAddress: initialUserstate.posterAddress,
            postContentID: initialUserstate.postContentID,
            allUsersCounter: initialUserstate.allUsersCounter,
            userUsersCounter: initialUserstate.userUsersCounter,
            postBlockHeight: initialUserstate.postBlockHeight,
            deletionBlockHeight: Field(0),
        });

        const UsersAfter = postWitness.computeRootAndKey(latestUserstate.hash())[0];
        UsersAfter.assertEquals(latestUsers);

        return new UsersTransition({
            initialAllUsersCounter: allUsersCounter,
            latestAllUsersCounter: allUsersCounter,
            initialUsersUsersCounters: usersUsersCounters,
            latestUsersUsersCounters: usersUsersCounters,
            initialUsers: initialUsers,
            latestUsers: UsersAfter,
            blockHeight: blockHeight,
        });
    }
}


export const Users = Experimental.ZkProgram({
    publicInput: UsersTransition,

    methods: {
        provePostPublishingTransition: {
            privateInputs: [
                Signature,
                Field,
                Field,
                Field,
                Field,
                MerkleMapWitness,
                Field,
                Field,
                Userstate,
                MerkleMapWitness,
            ],

            method(
                transition: UsersTransition,
                signature: Signature,
                initialAllUsersCounter: Field,
                initialUsersUsersCounters: Field,
                latestUsersUsersCounters: Field,
                initialUserUsersCounter: Field,
                userUsersCounterWitness: MerkleMapWitness,
                initialUsers: Field,
                latestUsers: Field,
                Userstate: Userstate,
                postWitness: MerkleMapWitness
            ) {
                const computedTransition =
                    UsersTransition.createPostPublishingTransition(
                        signature,
                        initialAllUsersCounter,
                        initialUsersUsersCounters,
                        latestUsersUsersCounters,
                        initialUserUsersCounter,
                        userUsersCounterWitness,
                        initialUsers,
                        latestUsers,
                        Userstate,
                        postWitness
                    );
                UsersTransition.assertEquals(computedTransition, transition);
            },
        },

        provePostDeletionTransition: {
            privateInputs: [
                Signature,
                Field,
                Field,
                Field,
                Field,
                Userstate,
                MerkleMapWitness,
                Field,
            ],

            method(
                transition: UsersTransition,
                signature: Signature,
                allUsersCounter: Field,
                usersUsersCounters: Field,
                initialUsers: Field,
                latestUsers: Field,
                initialUserstate: Userstate,
                postWitness: MerkleMapWitness,
                blockHeight: Field
            ) {
                const computedTransition = UsersTransition.createPostDeletionTransition(
                    signature,
                    allUsersCounter,
                    usersUsersCounters,
                    initialUsers,
                    latestUsers,
                    initialUserstate,
                    postWitness,
                    blockHeight
                );
                UsersTransition.assertEquals(computedTransition, transition);
            },
        },

        proveMergedUsersTransitions: {
            privateInputs: [SelfProof, SelfProof],

            method(
                mergedPostTransitions: UsersTransition,
                UsersDeletion1Proof: SelfProof<UsersTransition, undefined>,
                UsersDeletion2Proof: SelfProof<UsersTransition, undefined>
            ) {
                UsersDeletion1Proof.verify();
                UsersDeletion2Proof.verify();

                const computedTransition = UsersTransition.mergeUsersTransitions(
                    UsersDeletion1Proof.publicInput,
                    UsersDeletion2Proof.publicInput
                );
                UsersTransition.assertEquals(computedTransition, mergedPostTransitions);
            },
        },

        provePostRestorationTransition: {
            privateInputs: [
                Signature,
                Field,
                Field,
                Field,
                Field,
                Userstate,
                MerkleMapWitness,
                Field,
            ],

            method(
                transition: UsersTransition,
                signature: Signature,
                allUsersCounter: Field,
                usersUsersCounters: Field,
                initialUsers: Field,
                latestUsers: Field,
                initialUserstate: Userstate,
                postWitness: MerkleMapWitness,
                blockHeight: Field
            ) {
                const computedTransition =
                    UsersTransition.createPostRestorationTransition(
                        signature,
                        allUsersCounter,
                        usersUsersCounters,
                        initialUsers,
                        latestUsers,
                        initialUserstate,
                        postWitness,
                        blockHeight
                    );
                UsersTransition.assertEquals(computedTransition, transition);
            },
        },
    },
});

export let UsersProof_ = Experimental.ZkProgram.Proof(Users);
export class UsersProof extends UsersProof_ { }

// ============================================================================

