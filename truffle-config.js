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
      provider: () => new HDWalletProvider(privateKey, "https://use-util.cloud.milkomeda.com:8555"),
      network_id: 200101,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    }
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
