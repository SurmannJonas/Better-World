// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
  address public minter;

  event MinterChanged(address indexed from, address to);
  //Initializing Better World Token (BWT) of this NGO project. BWT Tokens are Tokens of the ERC20 Token Standard (1 ETH = 1 BWT)
  constructor() public payable ERC20("Better World Token", "BWT") {
    minter = msg.sender; //only initially
  }

  function passMinterRole(address dBank) public returns (bool) {
  	require(msg.sender==minter, 'Error, only owner can change pass minter role');
  	minter = dBank;

    emit MinterChanged(msg.sender, dBank);
    return true;
  }

  function mint(address account, uint256 amount) public {
		require(msg.sender==minter, 'Error, msg.sender does not have minter role'); //dBank
		_mint(account, amount);
	}
}
