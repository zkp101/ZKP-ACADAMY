// server/referral.js
const shortid = require('shortid');
function createReferral(db, telegramId) {
db.data.referrals = db.data.referrals || {};
// create code
const code = 'REF-' + shortid.generate().toUpperCase();
db.data.referrals[code] = { owner: telegramId, createdAt: Date.now(),
uses: [] };
return code;
}
function creditReferral(db, code, newTelegramId, wallet) {
db.data.referrals = db.data.referrals || {};
if(!db.data.referrals[code]) return false;
db.data.referrals[code].uses.push({ telegramId: newTelegramId, wallet, at:
Date.now() });
// optionally award small voucher to referrer and referee; for simplicity
store an entry
// actual voucher issuance: create a claim for referrer and referee via
signer.signVoucher
return true;
}
module.exports = { createReferral, creditReferral };