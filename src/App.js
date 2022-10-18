import { splitSignature } from 'ethers/lib/utils';
import Web3 from 'web3';
import { contract_abi, wallet_abi, contract_address } from './AbiAndOtherTrash';

function App() {
  const web3 = new Web3(window.ethereum);
  var account = null;

  const contract = new web3.eth.Contract(contract_abi, contract_address);

  const connectMetamask = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    var _account = accounts[0];
    account = _account
  }

  const DeployToken = async () => {
    let tokenName = (document.getElementById('tokenName').value).split(' ').join('');
    let tokenSymbol = (document.getElementById('tokenSymbol').value).split(' ').join('');
    if(tokenName && tokenSymbol) {
      contract.methods.deployNewERC20Token(tokenName, tokenSymbol).send({from: account});
    }
    contract.events.ERC20TokenCreated({}, (error, data) => {
      if (error) {
        console.log (error.message);
      } else {
        let newToken = data.returnValues[0];
        let link = document.getElementById('deployToken');
        link.innerHTML = newToken;
      }
    });
  }

  const DeployWallet = async () => {
    contract.methods.deployNewWallet().send({from: account});
    contract.events.WalletCreated({}, (error, data) => {
      if (error) {
        console.log (error.message);
      } else {
        let addressWallet = data.returnValues[0];
        let link = document.getElementById('walletAddress');
        link.innerHTML = addressWallet;
      }
    });
  }

  const mint = async () => {
    let accountForMint = (document.getElementById('account').value).split(' ').join('');
    let amount = (document.getElementById('amount').value).split(' ').join('');
    let tokenAddress = (document.getElementById('tokenAddress').value).split(' ').join('');
    if(accountForMint && amount && tokenAddress) {
      contract.methods.mint(accountForMint, amount, tokenAddress).send({from: account});
    }
  }

  const payFee = async () => {
    contract.methods.payFee().send({from: account, value:100000000000000});
  }

  const transfer = async () => {
    let accountTo = (document.getElementById('to').value).split(' ').join('');
    let amountTransfer = (document.getElementById('amountTransfer').value).split(' ').join('');
    let tokenAddressTransfer = (document.getElementById('tokenAddressTransfer').value).split(' ').join('');
    if(accountTo && amountTransfer && tokenAddressTransfer) {
      contract.methods.transfer(accountTo, amountTransfer, tokenAddressTransfer).send({from: account});
    }
  }

  const withdraw = async () => {
    let userAddress = (document.getElementById('addressWallet').value).split(' ').join('');
    if (userAddress) {
      let walletContract = new web3.eth.Contract(wallet_abi, userAddress);
      let amount = (document.getElementById('amountWithdraw').value).split(' ').join('');
      if (amount) {
        walletContract.methods.withdraw(amount).send({from: account});
      }
    }
  }

  const withdrawTokens = async () => {
    let userAddress = (document.getElementById('addressWallet').value).split(' ').join('');
    if (userAddress) {
      let walletContract = new web3.eth.Contract(wallet_abi, userAddress);
      let amount = (document.getElementById('amountTokens').value).split(' ').join('');
      let tokenAddress = (document.getElementById('tokenAddressTokens').value).split(' ').join('');
      if (amount && tokenAddress) {
        walletContract.methods.withdraw(tokenAddress, amount).send({from: account});
      }
    }
  }

  return (
    <div>
      <button onClick={connectMetamask}>Connect Metamask</button>
      <br />
      <h1>Factory: </h1>
      <br />
      <button onClick={DeployWallet}>Deploy new wallet</button>
      <span id="walletAddress"></span>
      <br />
      <button onClick={DeployToken}>Deploy new token</button>
      <input id="tokenName" type="text" name="quantity" placeholder="Name"></input>
      <input id="tokenSymbol" type="text" name="quantity" placeholder="Symbol"></input>
      <span id="deployToken"></span>
      <br />
      <button onClick={mint}>Mint</button>
      <input id="account" type="text" name="quantity" placeholder="Account"></input>
      <input id="amount" type="text" name="quantity" placeholder="Amount"></input>
      <input id="tokenAddress" type="text" name="quantity" placeholder="tokenAddress"></input>
      <br />
      <button onClick={payFee}>Pay fee</button>
      <br />
      <button onClick={transfer}>Transfer</button>
      <input id="to" type="text" name="quantity" placeholder="To"></input>
      <input id="amountTransfer" type="text" name="quantity" placeholder="Amount"></input>
      <input id="tokenAddressTransfer" type="text" name="quantity" placeholder="tokenAddress"></input>
      <h1>Wallet: </h1>
      <input id="addressWallet" type="text" name="quantity" placeholder="Your wallet address"></input>
      <br />
      <button onClick={withdraw}>Withdraw</button>
      <input id="amountWithdraw" type="text" name="quantity" placeholder="Amount"></input>
      <br />
      <button onClick={withdrawTokens}>Withdraw Tokens</button>
      <input id="amountTokens" type="text" name="quantity" placeholder="Amount"></input>
      <input id="tokenAddressTokens" type="text" name="quantity" placeholder="tokenAddress"></input>
    </div>
  );
}

export default App;