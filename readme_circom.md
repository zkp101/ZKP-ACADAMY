Circom skeleton: to compile and generate keys locally.
Commands (dev machine):
npm install -g circom snarkjs circom task_proof.circom --r1cs --wasm --sym -o build snarkjs powersoftau
new bn128 12 pot12_0000.ptau snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --
name="first" snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau snarkjs groth16
setup build/task_proof.r1cs pot12_final.ptau task_0000.zkey snarkjs zkey contribute task_0000.zkey
task_final.zkey --name="dev" snarkjs zkey export verificationkey task_final.zkey verification_key.json
Place `verification_key.json` into `server/` to allow server-side
verification with snarkjs. For mobile clients, you can compile wasm and ship
`task_proof_js` to client to generate witness and proof in-browser.
