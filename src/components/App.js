import React, { Component } from "react";
import { HashRouter, Route } from "react-router-dom";
import "./App.css";
import Web3 from "web3";
import Onidex from "../abis/Onidex.json";

import FormAndPreview from "../components/FormAndPreview/FormAndPreview";
import AllCryptoBoys from "./AllCryptoBoys/AllCryptoBoys";
import AccountDetails from "./AccountDetails/AccountDetails";
import ContractNotDeployed from "./ContractNotDeployed/ContractNotDeployed";
import ConnectToMetamask from "./ConnectMetamask/ConnectToMetamask";
import Loading from "./Loading/Loading";
import Navbar from "./Navbar/Navbar";
import MyCryptoBoys from "./MyCryptoBoys/MyCryptoBoys";
import Queries from "./Queries/Queries";

const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accountAddress: "",
      accountBalance: "",
      onidexContract: "0x5CD674A9B3dF35B2929cC0482b60a342CA798b7C",
      nftsCount: 0,
      nfts: [],
      loading: true,
      metamaskConnected: false,
      contractDetected: false,
      totalTokensMinted: 0,
      totalTokensOwnedByAccount: 0,
      nameIsUsed: false,
      colorIsUsed: false,
      colorsUsed: [],
      lastMintTime: null,
    };
  }

  componentDidMount = async () => {
    await this.loadWeb3();
    await this.loadBlockchainData();
    await this.setMetaData();
    await this.setMintBtnTimer();
  };

  setMintBtnTimer = () => {
    const mintBtn = document.getElementById("mintBtn");
    if (mintBtn !== undefined && mintBtn !== null) {
      this.setState({
        lastMintTime: localStorage.getItem(this.state.accountAddress),
      });
      this.state.lastMintTime === undefined || this.state.lastMintTime === null
        ? (mintBtn.innerHTML = "Mint My NFT")
        : this.checkIfCanMint(parseInt(this.state.lastMintTime));
    }
  };

  checkIfCanMint = (lastMintTime) => {
    const mintBtn = document.getElementById("mintBtn");
    const timeGap = 300000; //5min in milliseconds
    const countDownTime = lastMintTime + timeGap;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = countDownTime - now;
      if (diff < 0) {
        mintBtn.removeAttribute("disabled");
        mintBtn.innerHTML = "Mint My NFT";
        localStorage.removeItem(this.state.accountAddress);
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        mintBtn.setAttribute("disabled", true);
        mintBtn.innerHTML = `Next mint in ${minutes}m ${seconds}s`;
      }
    }, 1000);
  };

  loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
    if (window.BinanceChain) {
      window.web3 = new Web3(window.BinanceChain);
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  loadBlockchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      this.setState({ metamaskConnected: false });
    } else {
      this.setState({ metamaskConnected: true });
      this.setState({ loading: true });
      this.setState({ accountAddress: accounts[0] });
      let accountBalance = await web3.eth.getBalance(accounts[0]);
      accountBalance = web3.utils.fromWei(accountBalance, "Ether");
      this.setState({ accountBalance });
      this.setState({ loading: false });
      const networkId = await web3.eth.net.getId();
      const networkData = Onidex.networks[networkId];
      if (networkData) {
        this.setState({ loading: true });
        const onidexContract = web3.eth.Contract(
          Onidex.abi,
          networkData.address
        );
        this.setState({ onidexContract });
        this.setState({ contractDetected: true });
        const nftsCount = await onidexContract.methods
          .nftCounter()
          .call();
        this.setState({ nftsCount });
        for (var i = 1; i <= nftsCount; i++) {
          const nft = await onidexContract.methods
            .allNFTs(i)
            .call();
          this.setState({
            nfts: [...this.state.nfts, nft],
          });
        }
        let totalTokensMinted = await onidexContract.methods
          .getNumberOfTokensMinted()
          .call();
        totalTokensMinted = totalTokensMinted.toNumber();
        this.setState({ totalTokensMinted });
        let totalTokensOwnedByAccount = await onidexContract.methods
          .getTotalNumberOfTokensOwnedByAnAddress(this.state.accountAddress)
          .call();
        totalTokensOwnedByAccount = totalTokensOwnedByAccount.toNumber();
        this.setState({ totalTokensOwnedByAccount });
        this.setState({ loading: false });
      } else {
        this.setState({ contractDetected: false });
      }
    }
  };

  connectToMetamask = async () => {
    await window.ethereum.enable();
    this.setState({ metamaskConnected: true });
    window.location.reload();
  };

  setMetaData = async () => {
    if (this.state.nfts.length !== 0) {
      this.state.nfts.map(async (nft) => {
        const result = await fetch(nft.tokenURI);
        const metaData = await result.json();
        this.setState({
          nfts: this.state.nfts.map((nft) =>
            nft.tokenId.toNumber() === Number(metaData.tokenId)
              ? {
                  ...nft,
                  metaData,
                }
              : nft
          ),
        });
      });
    }
  };

  mintMyNFT = async (colors, name, tokenPrice) => {
    this.setState({ loading: true });
    const colorsArray = Object.values(colors);
    let colorsUsed = [];
    for (let i = 0; i < colorsArray.length; i++) {
      if (colorsArray[i] !== "") {
        let colorIsUsed = await this.state.onidexContract.methods
          .colorExists(colorsArray[i])
          .call();
        if (colorIsUsed) {
          colorsUsed = [...colorsUsed, colorsArray[i]];
        } else {
          continue;
        }
      }
    }
    const nameIsUsed = await this.state.onidexContract.methods
      .tokenNameExists(name)
      .call();
    if (colorsUsed.length === 0 && !nameIsUsed) {
      const {
        cardBorderColor,
        cardBackgroundColor,
        headBorderColor,
        headBackgroundColor,
        leftEyeBorderColor,
        rightEyeBorderColor,
        leftEyeBackgroundColor,
        rightEyeBackgroundColor,
        leftPupilBackgroundColor,
        rightPupilBackgroundColor,
        mouthColor,
        neckBackgroundColor,
        neckBorderColor,
        bodyBackgroundColor,
        bodyBorderColor,
      } = colors;
      let previousTokenId;
      previousTokenId = await this.state.onidexContract.methods
        .nftCounter()
        .call();
      previousTokenId = previousTokenId.toNumber();
      const tokenId = previousTokenId + 1;
      const tokenObject = {
        tokenName: "Onidex NFT",
        tokenSymbol: "ONI",
        tokenId: `${tokenId}`,
        name: name,
        metaData: {
          type: "color",
          colors: {
            cardBorderColor,
            cardBackgroundColor,
            headBorderColor,
            headBackgroundColor,
            leftEyeBorderColor,
            rightEyeBorderColor,
            leftEyeBackgroundColor,
            rightEyeBackgroundColor,
            leftPupilBackgroundColor,
            rightPupilBackgroundColor,
            mouthColor,
            neckBackgroundColor,
            neckBorderColor,
            bodyBackgroundColor,
            bodyBorderColor,
          },
        },
      };
      const cid = await ipfs.add(JSON.stringify(tokenObject));
      let tokenURI = `https://ipfs.infura.io/ipfs/${cid.path}`;
      const price = window.web3.utils.toWei(tokenPrice.toString(), "Ether");
      this.state.onidexContract.methods
        .mintNFT(name, tokenURI, price, colorsArray)
        .send({ from: this.state.accountAddress })
        .on("confirmation", () => {
          localStorage.setItem(this.state.accountAddress, new Date().getTime());
          this.setState({ loading: false });
          window.location.reload();
        });
    } else {
      if (nameIsUsed) {
        this.setState({ nameIsUsed: true });
        this.setState({ loading: false });
      } else if (colorsUsed.length !== 0) {
        this.setState({ colorIsUsed: true });
        this.setState({ colorsUsed });
        this.setState({ loading: false });
      }
    }
  };

  toggleForSale = (tokenId) => {
    this.setState({ loading: true });
    this.state.onidexContract.methods
      .toggleForSale(tokenId)
      .send({ from: this.state.accountAddress })
      .on("confirmation", () => {
        this.setState({ loading: false });
        window.location.reload();
      });
  };

  changeTokenPrice = (tokenId, newPrice) => {
    this.setState({ loading: true });
    const newTokenPrice = window.web3.utils.toWei(newPrice, "Ether");
    this.state.onidexContract.methods
      .changeTokenPrice(tokenId, newTokenPrice)
      .send({ from: this.state.accountAddress })
      .on("confirmation", () => {
        this.setState({ loading: false });
        window.location.reload();
      });
  };

  buyCryptoBoy = (tokenId, price) => {
    this.setState({ loading: true });
    this.state.onidexContract.methods
      .buyToken(tokenId)
      .send({ from: this.state.accountAddress, value: price })
      .on("confirmation", () => {
        this.setState({ loading: false });
        window.location.reload();
      });
  };

  render() {
    return (
      <div className="container">
        {!this.state.metamaskConnected ? (
          <ConnectToMetamask connectToMetamask={this.connectToMetamask} />
        ) : !this.state.contractDetected ? (
          <ContractNotDeployed />
        ) : this.state.loading ? (
          <Loading />
        ) : (
          <>
            <HashRouter basename="/">
              <Navbar />
              <Route
                path="/"
                exact
                render={() => (
                  <AccountDetails
                    accountAddress={this.state.accountAddress}
                    accountBalance={this.state.accountBalance}
                  />
                )}
              />
              <Route
                path="/marketplace"
                render={() => (
                  <AllCryptoBoys
                    accountAddress={this.state.accountAddress}
                    cryptoBoys={this.state.nfts}
                    totalTokensMinted={this.state.totalTokensMinted}
                    changeTokenPrice={this.changeTokenPrice}
                    toggleForSale={this.toggleForSale}
                    buyCryptoBoy={this.buyCryptoBoy}
                  />
                )}
              />
              <Route
                path="/mint"
                render={() => (
                  <FormAndPreview
                    mintMyNFT={this.mintMyNFT}
                    nameIsUsed={this.state.nameIsUsed}
                    colorIsUsed={this.state.colorIsUsed}
                    colorsUsed={this.state.colorsUsed}
                    setMintBtnTimer={this.setMintBtnTimer}
                  />
                )}
              />
              <Route
                path="/my-tokens"
                render={() => (
                  <MyCryptoBoys
                    accountAddress={this.state.accountAddress}
                    cryptoBoys={this.state.nfts}
                    totalTokensOwnedByAccount={
                      this.state.totalTokensOwnedByAccount
                    }
                  />
                )}
              />
              <Route
                path="/queries"
                render={() => (
                  <Queries onidexContract={this.state.onidexContract} />
                )}
              />
            </HashRouter>
          </>
        )}
      </div>
    );
  }
}

export default App;
