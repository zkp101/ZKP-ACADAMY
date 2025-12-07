// bot/bot.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
if(!BOT_TOKEN) {
console.error('Set TELEGRAM_BOT_TOKEN in .env');
process.exit(1);
}
const bot = new Telegraf(BOT_TOKEN);
// simple in-memory session per user (for demo only)
const sessions = {};
bot.start((ctx) => {
ctx.reply(`Welcome to ZKLearn! Learn Zero-Knowledge and earn rewards. Use /
verify to link wallet. Use /ref to get your referral code.`);
});
bot.command('verify', async (ctx) => {
const tgId = ctx.from.id.toString();
sessions[tgId] = sessions[tgId] || {};
sessions[tgId].expectingWallet = true;
await
ctx.reply('Send your wallet address (0x...) to start verification. If you
have a referral code, send it like this: /verify REF-XXXX');
});
bot.command('ref', async (ctx) => {
const tgId = ctx.from.id.toString();
// ask server for referral code if exists, else create
const r = await fetch(`${SERVER_URL}/create_referral`, { method: 'POST',
body: JSON.stringify({ telegramId: tgId }), headers: { 'Content-Type':
'application/json' } });
const j = await r.json();
if(j.refCode) {
await ctx.reply(`Your referral code is: ${j.refCode}`);
} else {
await ctx.reply('Error generating referral code');
}
});

bot.on('text', async (ctx) => {
const text = ctx.message.text.trim();
const tgId = ctx.from.id.toString();
sessions[tgId] = sessions[tgId] || {};
if(text.startsWith('/verify')) {
// allow /verify REF-xxxx or /verify alone
const parts = text.split(' ');
const refCode = parts.length > 1 ? parts[1] : null;
sessions[tgId].expectingWallet = true;
sessions[tgId].pendingRef = refCode;
await ctx.reply('Please send your wallet address (0x...)');
return;
}
if(sessions[tgId].expectingWallet && text.startsWith('0x')) {
const wallet = text;
sessions[tgId].expectingWallet = false;
sessions[tgId].wallet = wallet;
const r = await fetch(`${SERVER_URL}/start_verification`, { method:
'POST', body: JSON.stringify({ telegramId: tgId, walletAddress: wallet,
refCode: sessions[tgId].pendingRef }), headers: { 'Content-Type':
'application/json' } });
const j = await r.json();
if(j.error) {
await ctx.reply('Error: ' + j.error);
return;
}
if(j.already) { await ctx.reply('You are already verified.'); return; }
await ctx.reply(`Sign this nonce with your wallet and send the signature
with /sig <signature>\n\nNonce: ${j.nonce}`);
return;
}

if(text.startsWith('/sig')) {
const parts = text.split(' ');
if(parts.length < 2) { await ctx.reply('Usage: /sig <signature>');
return; }
const signature = parts[1];
const wallet = sessions[tgId] && sessions[tgId].wallet;
if(!wallet) { await ctx.reply('No pending wallet. Start with /verify');
return; }
const r = await fetch(`${SERVER_URL}/finish_verification`, { method:
'POST', body: JSON.stringify({ telegramId: tgId, walletAddress: wallet,
signature }), headers: { 'Content-Type': 'application/json' } });
const j = await r.json();
if(j.error) { await ctx.reply('Verification failed: ' + j.error);
return; }
if(j.awarded) {
await ctx.reply(`Verified! You received a voucher for $
{j.voucher.amount} tokens. To claim on-chain, use the web UI and paste the
voucher JSON.`);
} else {
await ctx.reply(`Verified. First-drop limit reached or no award. You
can still earn via referrals and learning modules.`);
}
return;
}

// fallback
await ctx.reply('Command not recognized. Use /verify to link wallet, /ref
to get referral code.');
});

bot.launch();
console.log('Bot started');



