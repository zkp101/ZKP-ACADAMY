// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
contract AirdropRedeemer {
using ECDSA for bytes32;
address public adminSigner;
IERC20 public token;
mapping(bytes32 => bool) public redeemed;
event Redeemed(address indexed to, uint256 amount, bytes32 claimId);
constructor(address _token, address _adminSigner) {
token = IERC20(_token);
adminSigner = _adminSigner;
}
// simple admin change (in dev only)
function setAdminSigner(address _s) external {
require(msg.sender == adminSigner, "only admin");
adminSigner = _s;
}
// redeem voucher signed off-chain
// voucher fields: recipient, amount, claimId, expiry
function redeem(address recipient, uint256 amount, bytes32 claimId,
uint256 expiry, bytes calldata signature) external {
require(block.timestamp <= expiry, "voucher expired");
require(!redeemed[claimId], "already redeemed");
bytes32 hash = keccak256(abi.encodePacked(recipient, amount,
claimId, expiry, address(this)));
bytes32 signedHash = hash.toEthSignedMessageHash();
address signer = signedHash.recover(signature);
require(signer == adminSigner, "invalid signature");
redeemed[claimId] = true;
require(token.transfer(recipient, amount), "transfer failed");
emit Redeemed(recipient, amount, claimId);
}
}
