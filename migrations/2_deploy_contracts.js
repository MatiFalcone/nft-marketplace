const Onidex = artifacts.require("Onidex");

module.exports = async function(deployer) {
  await deployer.deploy(Onidex);
};
