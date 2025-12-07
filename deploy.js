// hardhat/scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from", deployer.address);

  const Token = await ethers.getContractFactory("ZKLearnToken");
  const token = await Token.deploy("ZKLearn", "ZKL");
  await token.deployed();
  console.log("Token deployed:", token.address);

  const Redeemer = await ethers.getContractFactory("AirdropRedeemer");
  const redeemer = await Redeemer.deploy(token.address, deployer.address);
  await redeemer.deployed();
  console.log("Redeemer deployed:", redeemer.address);

  // optionally mint some tokens to deployer for admin actions
  await token.mint(deployer.address, ethers.utils.parseUnits("1000000", 18));
  console.log("Minted sample tokens to deployer");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
