// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

//Imported 'Token.sol' file for creation of the BWT ERC20 Token
import "./Token.sol";

//Smart Contract dBank
contract dBank {
  //variables
  Token private token;
  uint loanTime;

  //Mapping variables
  mapping(address => uint) public donationStart;
  mapping(address => uint) public borrowStart;
  mapping(address => uint) public etherBalanceOf;
  mapping(address => uint) public collateralEther;
  //State of contract is tracked with mapping boolean variables
  mapping(address => bool) public isDonated;
  mapping(address => bool) public isBorrowed;
  //Events store arguments in the transaction logs, as long as the contract exists on the Blockchain
  event Donation(address indexed user, address to, uint etherAmount);
  event Borrow(address indexed user, uint collateralEtherAmount, uint borrowedTokenAmount, uint loanStart);
  event PayOff(address indexed user);

  //Constructor method in order to initialize the contract state. The token to be created or rather minted by the contract
  // (borrow function) need to be initialized by the constructor method in this case
  constructor(Token _token) public {
    token = _token;
  }
  //Borrow function lending BWT Token that can be sent to the Better World NGO
  function borrow() payable public {
    require(msg.value>=1e16, 'Error, collateral must be >= 0.01 ETH');
    require(isBorrowed[msg.sender] == false, 'Error, loan already taken');

    //This Ether collateral will be locked till user pays off the loan
    collateralEther[msg.sender] = collateralEther[msg.sender] + msg.value;
    //Tokens amount to mint are equal to the amount of the collateral in Ether
    uint tokensToMint = collateralEther[msg.sender];
    //Mint function to mint and send BWT tokens to borrower by depositting an ETH collateral
    token.mint(msg.sender, tokensToMint);

    //Defining the start time of the loan which is important for the entire period of the loan
    borrowStart[msg.sender] = borrowStart[msg.sender] + block.timestamp;
    //Activation of borrower's loan status
    isBorrowed[msg.sender] = true;

    //Emit function to trigger the borrow event passing the arguments of the function
    emit Borrow(msg.sender, collateralEther[msg.sender], tokensToMint, block.timestamp);
  }
  //PayOff function to pay back the loan or rather the BWT Token
  function payOff() public {
    require(isBorrowed[msg.sender] == true, 'Error, loan not active');
    require(token.transferFrom(msg.sender, address(this), collateralEther[msg.sender]), "Error, can't receive tokens");

    //Calculating the end time of the loan to check, whether the loan was paid off timely. If not, the collateral is lost and the
    //BWT Token remain at the NGO Better World
    uint endTime = block.timestamp + loanTime;
    if(block.timestamp > endTime) {
     return;
    }
    //Sending user's collateral back, in case loan was paid back timely, without a fee, since it is a philanthropic application
    msg.sender.transfer(collateralEther[msg.sender]);

    //Resetting borrower's data, loan is repayed and closed
    collateralEther[msg.sender] = 0;
    isBorrowed[msg.sender] = false;

    //Emit function to trigger the PayOff event passing the arguments of the function
    emit PayOff(msg.sender);
  }
  //Deposit function to donate ETH to the NGO, after the loan is paid back by the NGO
  function deposit(address payable receiver) payable public {
    require(msg.value>=1e16, 'Error, deposit must be >= 0.01 ETH');
    require(isBorrowed[msg.sender] == false, 'Error, loan already taken');

    //Transferring ETH from your wallet (msg.sender) to the wallet of Better World (receiver)
    etherBalanceOf[msg.sender] -= msg.value;
    etherBalanceOf[receiver] += msg.value;

    //Activation of donation status
    isDonated[msg.sender] = true; //activate deposit status

    //Emit function to trigger the PayOff event passing the arguments of the function
    emit Donation(msg.sender, receiver, msg.value);
  }
}
