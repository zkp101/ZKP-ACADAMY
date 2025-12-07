// client/claim.js
(async function(){
const claimBtn = document.getElementById('claimBtn');
const out = document.getElementById('out');
claimBtn.onclick = async () => {
out.innerText = 'Processing...';
try {
const voucherText = document.getElementById('voucher').value.trim();
const signature = document.getElementById('signature').value.trim();
if(!voucherText || !signature) { out.innerText = 'Paste voucher JSON
and signature'; return; }
const voucher = JSON.parse(voucherText);
// connect to wallet
if(!window.ethereum) { out.innerText = 'Install MetaMask or use a
browser with Web3'; return; }
await window.ethereum.request({ method: 'eth_requestAccounts' });
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const userAddress = await signer.getAddress();
if(userAddress.toLowerCase() !== voucher.recipient.toLowerCase()) {
out.innerText = 'Connected wallet does not match voucher recipient';
return; }
const redeemerAddress = prompt('Enter Redeemer contract address
(paste)');
const abi = [
'function redeem(address recipient, uint256 amount, bytes32 claimId,
uint256 expiry, bytes signature)'
];
const redeemer = new ethers.Contract(redeemerAddress, abi, signer);
// amount might be string, ensure BigNumber
const tx = await redeemer.redeem(voucher.recipient, voucher.amount,
voucher.claimId, voucher.expiry, signature);
out.innerText = 'Tx sent: ' + tx.hash + '\nWaiting for
confirmation...';
await tx.wait();
out.innerText = 'Redeemed! Tx: ' + tx.hash;
} catch (e) {
out.innerText = 'Error: ' + e.message;
}
};
})();
