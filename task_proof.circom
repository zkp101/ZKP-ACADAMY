pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";
template TaskProof() {
 // Private inputs
 signal input walletHash; // numeric field element (hashed wallet)
 signal input tasks; // numeric bitset for tasks completed
 signal input salt; // random salt
 // Public input
 signal input commitment; // Poseidon(walletHash, tasks, salt)
 component p = Poseidon(3);
 p.inputs[0] <== walletHash;
 p.inputs[1] <== tasks;
 p.inputs[2] <== salt;
 signal computed <== p.out;
 computed === commitment;
}
component main = TaskProof();
