require("babel-register");
require("babel-polyfill");
require("dotenv").config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const privateKey = process.env.PK;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
    },
    milkomeda: {
      provider: () => new HDWalletProvider(privateKey, "https://rpc-devnet-cardano-evm.c1.milkomeda.com/"),
      network_id: 200101,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    polygon: {
      provider: () => new HDWalletProvider(privateKey, "https://polygon-rpc.com"),
      network_id: 137,
      confirmations: 10,
      timeoutBlocks: 200,
      gasPrice: 70000000000,
      skipDryRun: true
    },
    smartChainTestnet: {
      provider: () => new HDWalletProvider(privateKey, `https://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    matic: {
      provider: () => new HDWalletProvider(privateKey, `https://rpc-mumbai.maticvigil.com`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 10000
    },
  },
  contracts_directory: "./src/contracts/",
  contracts_build_directory: "./src/abis/",
  compilers: {
    solc: {
      version: "pragma",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
