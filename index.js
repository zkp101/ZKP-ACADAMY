// server/index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ethers } = require('ethers');
const { nanoid } = require('nanoid');
const { Low, JSONFile } = require('lowdb');
const signer = require('./signer');
const referral = require('./referral');
const app = express();
app.use(bodyParser.json({limit: '1mb'}));
app.use(cors());
// DB (lightweight JSON DB so you can run without a full DB)
const adapter = new JSONFile(__dirname + '/db.json');
const db = new Low(adapter);
async function initDB(){
await db.read();
db.data = db.data || { verified: {}, commitCount: 0, claims: {},
referrals: {} };
await db.write();
}

initDB();
// Configables via .env
const MAX_FIRST_DROPS = Number(process.env.MAX_FIRST_DROPS || 100000);
const FIRST_DROP_AMOUNT =
ethers.utils.parseUnits(process.env.FIRST_DROP_AMOUNT || "100", 18); // 100
tokens default
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
// Helpers
function makeClaimId(commitment, wallet) {
// deterministic claimId
return
ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32","address","uint256"],
[commitment, wallet, Date.now()]));
}

// Start verification: returns nonce to sign
app.post('/start_verification', async (req, res) => {
const { telegramId, walletAddress, refCode } = req.body;
if(!telegramId || !walletAddress) return res.status(400).send({ error:
'missing' });
await db.read();
// if user already verified, return
if(db.data.verified[telegramId] && db.data.verified[telegramId].done) {
return res.json({ already: true, message: 'Already verified' });
}

// generate nonce and store
const nonce = nanoid(12);
db.data.verified[telegramId] = db.data.verified[telegramId] || {};
db.data.verified[telegramId].pending = { wallet: walletAddress, nonce,
refCode: refCode || null };

await db.write();
res.json({ nonce, message: `Sign this nonce with your wallet to link: $
{nonce}` });
});
// Finish verification: user provides signature of nonce
app.post('/finish_verification', async (req, res) => {
const { telegramId, walletAddress, signature } = req.body;
if(!telegramId || !walletAddress || !signature) return
res.status(400).send({ error: 'missing' });
await db.read();
const pending = db.data.verified[telegramId] &&
db.data.verified[telegramId].pending;
if(!pending || pending.wallet.toLowerCase() !==
walletAddress.toLowerCase()) return res.status(400).send({ error: 'no
pending' });
// verify signature: user must sign the nonce message
const msg = pending.nonce;
try {
const recovered = ethers.utils.verifyMessage(msg, signature);
if(recovered.toLowerCase() !== walletAddress.toLowerCase()) return
res.status(400).send({ error: 'invalid signature' });
// success: mark verified
const alreadyVerified = db.data.verified[telegramId].done;
if(alreadyVerified) return res.status(400).send({ error: 'already
verified' });
const currentFirstDrops = Number(db.data.commitCount || 0);
let awarded = false;
let voucher = null;
if(currentFirstDrops < MAX_FIRST_DROPS) {
// create commitment (simple: wallet + nonce -> commitment)
const commitment =
ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address","string"],
[walletAddress, pending.nonce]));
const claimId = makeClaimId(commitment, walletAddress);
const expiry = Math.floor(Date.now()/1000) + 60*60*24*7; // 7 days
const signatureVoucher = await signer.signVoucher(walletAddress,
FIRST_DROP_AMOUNT.toString(), claimId, expiry, CONTRACT_ADDRESS);
db.data.commitCount = currentFirstDrops + 1;
db.data.claims[claimId] = { wallet: walletAddress, commitment, expiry,
amount: FIRST_DROP_AMOUNT.toString(), issuedAt: Date.now(), source:
'first_drop' };
awarded = true;
voucher = { recipient: walletAddress, amount:
FIRST_DROP_AMOUNT.toString(), claimId, expiry };
// handle referral crediting
if(pending.refCode) {
referral.creditReferral(db, pending.refCode, telegramId,
walletAddress);
}
// mark verified
db.data.verified[telegramId].done = { wallet: walletAddress, claimId,
awarded };
await db.write();
return res.json({ awarded: true, voucher, signature:
signatureVoucher });
} else {
// mark verified but no award
db.data.verified[telegramId].done = { wallet: walletAddress, awarded:
false, claimId: null };
await db.write();
// still credit referral if present
if(pending.refCode) referral.creditReferral(db, pending.refCode,
telegramId, walletAddress);
return res.json({ awarded: false, message: "First-drop limit
reached" });
}
} catch (e) {
console.error(e);
return res.status(400).send({ error: 'signature verify failed' });
}
})

// referral endpoints
app.post('/create_referral', async (req, res) => {
const { telegramId } = req.body;
if(!telegramId) return res.status(400).send({ error: 'missing' });
await db.read();
const code = referral.createReferral(db, telegramId);
await db.write();
res.json({ refCode: code });
});
app.get('/referral_status/:code', async (req, res) => {
const code = req.params.code;
await db.read();
const info = db.data.referrals[code] || null;
res.json({ code, info });
});
// partner webhook: partners call this to reward users
app.post('/partner_webhook', async (req, res) => {
const { partnerKey, action, wallet, partnerReference } = req.body;
// In production validate partnerKey and sign webhook requests
if(!partnerKey || action !== 'complete' || !wallet) return
res.status(400).send({ error: 'bad' });

await db.read();
const PT_AMOUNT = ethers.utils.parseUnits("10", 18);
const commitment =
ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address","string"],
[wallet, partnerKey]));
const claimId = makeClaimId(commitment, wallet);
const expiry = Math.floor(Date.now()/1000) + 60*60*24*7;
const signatureVoucher = await signer.signVoucher(wallet,
PT_AMOUNT.toString(), claimId, expiry, CONTRACT_ADDRESS);
db.data.claims[claimId] = { wallet, commitment, expiry, amount:
PT_AMOUNT.toString(), issuedAt: Date.now(), partner: partnerKey,
partnerReference };
await db.write();
return res.json({ success: true, voucher: { recipient: wallet, amount:
PT_AMOUNT.toString(), claimId, expiry }, signature: signatureVoucher });
});
// endpoint to redeem voucher server-side (optional: relayer pays gas)
app.post('/relay_claim', async (req, res) => {
// In a simple zero-budget MVP, we won't implement a full relayer here.
// This endpoint is a placeholder showing where you'd accept a claim and
// broadcast the redeem transaction using a relayer key.
res.json({ message: 'relay_claim endpoint placeholder - implement relayer
to pay gas if desired' });
});
// status (dev)
app.get('/status', async (req, res) => {
await db.read();
res.json({ commitCount: db.data.commitCount, verifiedCount:
Object.keys(db.data.verified || {}).length, referrals:
Object.keys(db.data.referrals || {}).length });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));


