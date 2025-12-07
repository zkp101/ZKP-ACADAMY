# zkLearn-Telegram MVP — Deploy Guide (Zero-budget approach)
## 1) Create GitHub repo and push files
Create a repo and paste the files from this document.
## 2) Contracts: Deploy to Mumbai (free faucet)
1. Install Hardhat and dependencies
2. Set `hardhat/.env` with `MUMBAI_RPC` and `DEPLOYER_PRIVATE_KEY` (test
wallet)
3. Run `npx hardhat run scripts/deploy.js --network mumbai`
4. Note token & redeemer addresses and set `server/.env CONTRACT_ADDRESS`
## 3) Server (free hosting options)
Locally:
cd server npm install node index.js
Free hosting options:
- Render (free tier): Create a new web service, link GitHub repo, set start
command `node index.js`.
- Vercel: Use serverless functions or an Express adapter (requires changes).
Render is easiest for a full Node server.
Set `server/.env` with `ADMIN_PRIVATE_KEY` (generate a dev key) and
`CONTRACT_ADDRESS`.

## 4) Telegram Bot
1. Create bot with BotFather and get token
2. Set `bot/.env` with TELEGRAM_BOT_TOKEN and SERVER_URL
3. Run `cd bot && npm install && node bot.js`
## 5) Client claim UI
Host `client/` folder on GitHub pages or any static host.
## 6) Circom
If you want to upgrade to true ZK proofs, follow `circuits/readme_circom.md`
to compile circuit, generate zkey, then copy `verification_key.json` into
`server/` and call snarkjs verify in the server.
## 7) Sponsor Campaigns
Use `/partner_webhook` to accept partner notifications and issue vouchers.
Partners fund rewards off-chain and you transfer tokens from sponsor wallet
or mint-on-demand.
## 8) Security & production notes
- Replace `ADMIN_PRIVATE_KEY` with secure storage (vault/HSM) before
production.
- Replace JSON file DB with Postgres or Mongo for production.
- Use EIP-712 typed signatures for stronger security.
- Audit smart contracts and flows before large distributions.
