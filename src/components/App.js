//Imports needed for the App.js browser application including the frameworks React and Web3
import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../abis/dBank.json'
import React, { Component } from 'react';
import Token from '../abis/Token.json'
import dfx from '../dfx_logo.png';
import Web3 from 'web3';
import './App.css';

class App extends Component {
  //Load Ethereum Blockchain data for this Web3 application
  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }
  //Functions to interact with MetaMask, in case MetaMask is already connected to this application
  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum!=='undefined'){
      const web3 = new Web3(window.ethereum)
      //Enabling MetaMask and connecting MetaMask account to this Web3 application
      window.ethereum.enable().catch(error => {
        //User denied account access to MetaMask
        console.log(error)
      })

      const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()
      //Default Blockchain address of the NGO Better World where donations can be sent to
      web3.eth.defaultAccount = '0x16f283933F335bE00285211d7DE727371b0daCAC'
      const defaultAddress = web3.eth.defaultAccount
      console.log(defaultAddress)
      //Loading balances of accounts that are interacting with this application
      if(typeof accounts[0] !=='undefined'){
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({account: accounts[0], balance: balance, web3: web3})
      } else {
        window.alert('Please login with MetaMask')
      }
      //Loading balances of the default MetaMask address of the NGO that is interacting with this application
      if(typeof defaultAddress !=='undefined'){
        const balance = await web3.eth.getBalance(defaultAddress)
        this.setState({address: defaultAddress, balance: balance, web3: web3})
      } else {
        window.alert('Please login with MetaMask')
      }

      //Loading smart contracts needed for this application: ERC20 Token Contract to create Tokens and dBank contract enabling the borrow, payoff and donation logic
      try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address)
        const dbank = new web3.eth.Contract(dBank.abi, dBank.networks[netId].address)
        const dBankAddress = dBank.networks[netId].address
        this.setState({token: token, dbank: dbank, dBankAddress: dBankAddress})
      } catch (e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }

    } else {
      window.alert('Please install MetaMask')
    }
  }
  //deposit function enabling donations to the NGO Better World
  async deposit(amount) {
    if(this.state.dbank!=='undefined'){
      try{
        //Calling deposit-function within the smart contract 'dBank.sol' to send donation to Better World. 'this.state.address' is the address of the Better World account
        await this.state.dbank.methods.deposit(this.state.address).send({value: amount.toString(), from: this.state.account, to: this.state.address})
      } catch (e) {
        console.log('Error, deposit: ', e)
      }
    }
  }
  //borrow function enabling the creation of BWT Tokens that can be lent to the NGO Better World
  async borrow(amount) {
    if(this.state.dbank!=='undefined'){
      try{
        //Calling borrow-function within the smart contract 'dBank.sol'
        await this.state.dbank.methods.borrow().send({value: amount.toString(), from: this.state.account})
      } catch (e) {
        console.log('Error, borrow: ', e)
      }
    }
  }
  //payoff function enabling the pay-back of BWT Tokens that were lent to the NGO Better World
  async payOff(e) {
    e.preventDefault()
    if(this.state.dbank!=='undefined'){
      try{
        const collateralEther = await this.state.dbank.methods.collateralEther(this.state.account).call({from: this.state.account})
        const tokenBorrowed = collateralEther
        await this.state.token.methods.approve(this.state.dBankAddress, tokenBorrowed.toString()).send({from: this.state.account})
        //Calling payoff-function within the smart contract 'dBank.sol'
        await this.state.dbank.methods.payOff().send({from: this.state.account})
      } catch(e) {
        console.log('Error, pay off: ', e)
      }
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      dBankAddress: null
    }
  }
  //HTML code enabled with the React framework to build the Front-End of this donation application
  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark bg-white fixed-top flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="/"
            rel="noopener noreferrer"
          >
        <img src={dfx} className="App-logo" alt="logo" height="32"/>
          <b className="text-blue">Better World</b>
        </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1 className="text-blue">Better World Donation Bank</h1>
          <h2 className="text-blue">{this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">

                <Tab eventKey="borrow" title="Borrow">
                  <div className="text-blue">

                  <br></br>
                    Do you want to borrow tokens for NGO Better World*?
                    <br></br>
                    (You'll get 100% of collateral, in Tokens)
                    <br></br>
                    Type collateral amount (in ETH)
                    <br></br>
                    <br></br>
                    <form onSubmit={(e) => {

                      e.preventDefault()
                      let amount = this.borrowAmount.value
                      amount = amount * 10 **18 //convert to wei
                      this.borrow(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='borrowAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.borrowAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>BORROW</button>
                    </form>
                    <br></br>
                    *You can mint as much Tokens as you deposited as collateral
                    <br></br>
                    in Ether without any fees.
                    <br></br>
                    These Tokens can be sent to the NGO as a loan.
                    <br></br>
                    Contact: better@world.com
                  </div>
                </Tab>
                <Tab eventKey="payOff" title="Payoff">
                  <div className="text-blue">

                  <br></br>
                    As soon as Better World as paid back the loan to you,
                    <br></br>
                    the Tokens can be exchanged for the collateral in ETH?
                    <br></br>
                    (You'll receive your collateral back)
                    <br></br>
                    <br></br>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.payOff(e)}>PAYOFF</button>
                  </div>
                </Tab>
                <Tab eventKey="deposit" title="Donate">
               <div className="text-blue">
               <br></br>
                 How much do you want to donate to NGO Better World?
                 <br></br>
                 (min. amount is 0.01 ETH)
                 <br></br>
                 <form onSubmit={(e) => {
                   e.preventDefault()
                   let amount = this.depositAmount.value
                   amount = amount * 10**18 //convert to wei
                   this.deposit(amount)
                 }}>
                   <div className='form-group mr-sm-2'>
                   <br></br>
                     <input
                       id='depositAmount'
                       step="0.01"
                       type='number'
                       ref={(input) => { this.depositAmount = input }}
                       className="form-control form-control-md"
                       placeholder='amount...'
                       required />
                   </div>
                   <button type='submit' className='btn btn-primary'>DONATE</button>
                 </form>

               </div>
             </Tab>

              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
