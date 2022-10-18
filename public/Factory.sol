// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import "./OwnableAndERC.sol";

interface FactoryInterface {
    function transfer(address to, uint amount, address token) external payable returns (bool);
    function deployNewERC20Token(string calldata name, string calldata symbol) external returns (address);
    function mint(address account, uint amount, address token) external payable returns (bool);
    function payFee() external payable;

}

contract ERC20Token is ERC20 {
    constructor(
        string memory name,
        string memory symbol
    )
    ERC20(name, symbol) {}
    function ERC20Mint(address to, uint amount) public {
        super._mint(to, amount);
    }
}

contract Factory is FactoryInterface {
    constructor() payable {}
    mapping(address => address) public tokens;
    mapping(address => bool) public feePaid;
    mapping(address => address) public wallets;                      
    event ERC20TokenCreated(address tokenAddress);
    event WalletCreated(address walletAddress);
    bytes4 private constant MintSelector = bytes4(keccak256(bytes('_mint(address,uint256)')));
    bytes4 private constant TransferSelector = bytes4(keccak256(bytes('_transfer(address,address,uint256)')));
    bytes4 private constant transferFromSelector = bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
    bytes4 private constant WithdrawSelector = bytes4(keccak256(bytes('withdrawTokens(address,uint)')));
    bytes4 private constant InterfaceInBytes = 0x858aa336;

    function deployNewERC20Token(
        string calldata name,
        string calldata symbol
    ) external returns (address) {
        require(wallets[msg.sender] != address(0), "You have not wallet");
        ERC20Token t = new ERC20Token(
            name,
            symbol
        );
        tokens[address(t)] = msg.sender;
        emit ERC20TokenCreated(address(t));

        return address(t);
    }

    function deployNewWallet() external returns (address) {
        require(wallets[msg.sender] == address(0), "You already have wallet");
        CreateWallet w = new CreateWallet(msg.sender);
        wallets[msg.sender] = address(w);
        emit WalletCreated(address(w));

        return address(w);
    }

    function mint(address account, uint amount, address token) external payable returns (bool) {
        require(account != address(0), "ERC20: mint to the zero address");
        require(msg.sender == tokens[token], "Only owner can mint tokens");

        (bool success, ) = token.call(abi.encodeWithSelector(MintSelector, account, amount * 10 ** 18));
        require(success);

        return success;
    }

    function payFee() external payable{
        require(wallets[msg.sender] != address(0), "You have not wallet");
        require(msg.value == 10 ** 14 wei, "Fee is 100000000000000 wei or 0.0001 eth, please, pay the fee"); //без понятия как сделать снятие с условного кошелька
        feePaid[wallets[msg.sender]] = true;
    }

    function withdrawTokens(address wallet, address token, uint amount) public payable returns(bool) {
        require(wallets[msg.sender] != address(0), "You have not wallet");
        (bool success, ) = wallet.call(abi.encodeWithSelector(WithdrawSelector, token, amount * 10 ** 18));
        return success;
    }

    function transfer(address to, uint amount, address token) external payable returns (bool) {
        require(to != address(0), "ERC20: mint to the zero address");
        require(wallets[msg.sender] != address(0), "You have not wallet");
        require(feePaid[wallets[msg.sender]] == true, "You in the black list!");

        uint256 success;
        uint256 result;

        (success, result) = noThrowCall(token, InterfaceInBytes);
        if ((success==0)||(result==0)) {
            feePaid[wallets[msg.sender]] = false;
            return false;
        }

        (bool success1, ) = token.call(abi.encodeWithSelector(TransferSelector, payable(msg.sender), to, amount * 10 ** 18));
        require(success1);
        return success1;
    }

    function noThrowCall(address _contract, bytes4 _interfaceId) internal view returns (uint256,uint256) {
        assembly {
                let x := mload(0x40)               // Find empty storage location using "free memory pointer"
                mstore(x, InterfaceInBytes)                // Place signature at beginning of empty storage
                mstore(add(x, 0x04), _interfaceId) // Place first argument directly next to signature

                let success := staticcall(
                                    30000,         // 30k gas
                                    _contract,     // To addr
                                    x,             // Inputs are stored at location x
                                    0x24,          // Inputs are 36 bytes long
                                    x,             // Store output over input (saves space)
                                    0x20)          // Outputs are 32 bytes long

                let result := mload(x)                 // Load the result
        }
    }
}

contract CreateWallet {
    address public owner;
    constructor(address _owner) payable {
        owner = _owner;
    }
    bytes4 private constant TransferSelector = bytes4(keccak256(bytes('_transfer(address,address,uint256)')));

    function withdrawTokens(address token, uint amount) public payable returns (bool) {
        require(msg.sender == owner);
        (bool success1, ) = token.call(abi.encodeWithSelector(TransferSelector, address(this), msg.sender, amount * 10 ** 18));
        require(success1);
        return success1;
    }

    function withdraw(uint amount) public payable {
        payable(owner).transfer(amount);
    }
}