var MawCoin = artifacts.require("./contracts/MawCoin.sol");
var MawCoinMultiSigWallet = artifacts.require("./contracts/MawCoinMultiSigWallet.sol");
var MawCoinMultiSigWalletWithMint = artifacts.require("./contracts/MawCoinMultiSigWalletWithMint.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(MawCoin, 'MAW', 'MAWCoin', accounts[0], accounts[1], accounts[2]).then( () => {
    console.log(`MawCoin deployed: address = ${MawCoin.address}`);

    deployer.
      deploy(MawCoinMultiSigWallet, [accounts[0], accounts[1], accounts[2]], 2, MawCoin.address,
          "vault multisig wallet");

      deployer.
      deploy(MawCoinMultiSigWalletWithMint, [accounts[0], accounts[1], accounts[2]], 2, MawCoin.address,
          "vault multisig wallet with mint");

  });
};
