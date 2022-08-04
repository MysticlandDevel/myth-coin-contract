var MythCoin = artifacts.require("./contracts/MythCoin.sol");
var MythCoinMultiSigWallet = artifacts.require("./contracts/MythCoinMultiSigWallet.sol");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(MythCoin, 'COIN', 'TheCoin', 10_000_000_000, 9, accounts[0], accounts[1], accounts[2]
    , 20_000_000_000).then(() => {
    console.log(`Deployed: address = ${MythCoin.address}`);

    deployer.deploy(MythCoinMultiSigWallet, [accounts[0], accounts[1], accounts[2]], 2, MythCoin.address,
      "vault multisig wallet");
  });
};
