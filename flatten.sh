#!/bin/zsh
truffle-flattener contracts/MythCoin.sol > MythCoin.flatten.sol
truffle-flattener contracts/MythCoinMultiSigWallet.sol > MythCoinMultiSigWallet.flatten.sol
