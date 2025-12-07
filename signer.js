// server/signer.js
require('dotenv').config();
const { ethers } = require('ethers');
// <<< REPLACE with your ADMIN PRIVATE KEY in server/.env (dev only) >>>
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY ||
"0x0000000000000000000000000000000000000000000000000000000000000000";
const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
async function signVoucher(recipient, amount, claimId, expiry,
contractAddress) {
// Use solidityKeccak256 to match contract abi.encodePacked
const hash = ethers.utils.solidityKeccak256(
["address","uint256","bytes32","uint256","address"],
[recipient, ethers.BigNumber.from(amount).toString(), claimId, expiry,
contractAddress]
);
const sig = await wallet.signMessage(ethers.utils.arrayify(hash));
return sig;
}
module.exports = { signVoucher };