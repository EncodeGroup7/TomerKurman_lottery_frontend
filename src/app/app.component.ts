import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ethers, Transaction } from 'ethers';
import tokenJson from '../assets/LotteryToken.json';
import contractJson from '../assets/Lottery.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  provider: ethers.providers.Provider;
  wallet: ethers.Wallet | undefined;
  privateOrMnemonic: string | undefined;
  contract: ethers.Contract | undefined;
  token: ethers.Contract | undefined;
  // state: boolean | undefined;
  purchaseRatio: string | undefined;
  betFee: string | undefined;
  betPrice: string | undefined;
  betters: string | undefined;
  ethBalance: string | undefined;
  tokenBalance: string | undefined;
  ethBalanceFull: string | undefined;
  tokenBalanceFull: string | undefined;
  ownerPool: string | undefined;
  prizePool: string | undefined;
  prize: string | undefined;

  validAddressFlag = false;
  validKeyFlag = false;
  keySelected = false;
  bets = false;
  isOwner = false;

  constructor(private http: HttpClient) {
    this.provider = ethers.getDefaultProvider('goerli');

    // // take out after dev
    // this.keySelected = true;
    // this.validAddressFlag = true;
    // this.validKeyFlag = true;
    // this.privateOrMnemonic = 'mnemonic';
    // this.importWallet(
    //   '0x96032cD1e5F39D3e1B7BAc0e4485423614dB09D5',
    //   'hero oak bless ticket elbow pudding finger opera dial enemy mechanic nasty'
    // );

    // Initiate state loop to update state
    // Add a loading bar for every state change blockchain transaction
  }

  private connectTokenContract(address: string) {
    this.token = new ethers.Contract(address, tokenJson.abi, this.wallet);
  }

  private connectLotteryContract(address: string) {
    this.contract = new ethers.Contract(address, contractJson.abi, this.wallet);
  }

  setPrivateOrMnemonic(key: string) {
    this.privateOrMnemonic = key;
    this.keySelected = true;
  }

  async importWallet(walletAddressIn: string, mnemonicOrKey: string) {
    /^0x[a-fA-F0-9]{40}$/g.test(walletAddressIn)
      ? (this.validAddressFlag = true)
      : (this.validAddressFlag = false);
    mnemonicOrKey ? (this.validKeyFlag = true) : (this.validKeyFlag = false);
    let errorMsg = [];

    if (!this.keySelected) errorMsg.push('A type of key must be selected.');
    if (!this.validAddressFlag) errorMsg.push('Address is invalid.');
    if (!this.validKeyFlag)
      errorMsg.push('Mnemonic/Private key input should not be empty.');

    if (errorMsg.length > 0) {
      let fullMsg = '';
      for (let index = 0; index < errorMsg.length; index++) {
        fullMsg += `* ${errorMsg[index]}\n`;
      }

      alert(fullMsg);
      return;
    }

    if (this.privateOrMnemonic == 'mnemonic') {
      try {
        this.wallet = ethers.Wallet.fromMnemonic(mnemonicOrKey).connect(
          this.provider
        );
      } catch (error) {
        alert(error);
        return;
      }
    } else if (this.privateOrMnemonic == 'private') {
      try {
        this.wallet = new ethers.Wallet(mnemonicOrKey).connect(this.provider);
      } catch (error) {
        alert(error);
        return;
      }
    }

    this.initiateLottery();
    this.updateInfo();
  }

  updateInfo() {
    if (this.contract) {
      this.contract['betFee']()
        .then((fee: ethers.BigNumberish) => {
          this.betFee = fee.toString();
        })
        .catch((err: any) => {
          alert(`Bet Fee: ${err}`);
          console.log(err);
        });
      this.contract['betPrice']()
        .then((price: ethers.BigNumberish) => {
          this.betPrice = price.toString();
        })
        .catch((err: any) => {
          alert(`Bet Price: ${err}`);
          console.log(err);
        });
      this.contract['purchaseRatio']()
        .then((ratio: ethers.BigNumberish) => {
          this.purchaseRatio = ratio.toString();
        })
        .catch((err: any) => {
          alert(`Purchase Ratio: ${err}`);
          console.log(err);
        });

      this.contract['ownerPool']()
        .then((pool: ethers.BigNumberish) => {
          this.ownerPool = pool.toString();
        })
        .catch((err: any) => {
          alert(`Owner Pool: ${err}`);
          console.log(err);
        });
      this.contract['prizePool']()
        .then((pool: ethers.BigNumberish) => {
          this.prizePool = pool.toString();
        })
        .catch((err: any) => {
          alert(`Prize Pool: ${err}`);
          console.log(err);
        });
    }

    if (this.token)
      this.token['balanceOf'](this.wallet?.address)
        .then((balance: ethers.BigNumberish) => {
          this.tokenBalance = ethers.utils
            .formatEther(balance.toString())
            .substring(0, 5);
            this.tokenBalanceFull = ethers.utils
            .formatEther(balance.toString());
        })
        .catch((err: any) => {
          alert(`Balance Of Tokens: ${err}`);
          console.log(err);
        });

    if (this.wallet)
      this.provider
        .getBalance(this.wallet?.address)
        .then((balance: ethers.BigNumberish) => {
          this.ethBalance = ethers.utils
            .formatEther(balance.toString())
            .substring(0, 5);
            this.ethBalanceFull = ethers.utils
            .formatEther(balance.toString())
        })
        .catch((err: any) => {
          alert(`ETH Balance: ${err}`);
          console.log(err);
        });
  }

  initiateLottery() {
    this.connectLotteryContract('0xaCB888E6F89e02400d338CedEA1e13D8c7079e82');
    this.connectTokenContract('0x21646F779aC83EF2B44D0db0CEc0D2694e079929');

    if (this.contract) {
      this.contract['owner']()
        .then((address: string) => {
          this.isOwner = address == this.wallet?.address ? true : false;
        })
        .catch((err: any) => {
          alert(`Owner: ${err}`);
          console.log(err);
        });
      this.initiateState();
    }
  }

  openBets() {
    let duration = prompt(
      'How long in seconds should the lottery be open for?'
    );

    if (isNaN(Number(duration))) {
      alert('Input must be a valid number');
      return;
    }

    this.provider.getBlock('latest').then((currentBlock) => {
      if (this.contract)
        this.contract['openBets'](currentBlock.timestamp + Number(duration))
          .then((tx: any) => {
            tx.wait().then((receipt: any) => {
              this.initiateState();
              let date = new Date(currentBlock.timestamp + Number(duration));
              this.updateInfo();
              alert(
                `Bets are open! (${receipt.transactionHash})\n open until ${date}.`
              );
            });
          })
          .catch((err: any) => {
            alert(`Open Bets: ${err}`);
            console.log(err);
          });
    });
  }

  closeLottery() {
    if (this.contract)
      this.contract['closeLottery']()
        .then((result: any) => {
          this.initiateState();
        })
        .catch((err: any) => {
          alert(`Close Lottery: ${err}`);
          console.log(err);
        });
  }

  initiateState() {
    if (this.contract)
      this.contract['betsOpen']()
        .then((state: boolean) => {
          this.bets = state;
        })
        .catch((err: any) => {
          alert(`Are Bets Open: ${err}`);
          console.log(err);
        });
  }

  ownerWithdraw() {
    if (this.ownerPool && this.contract) {
        this.contract['ownerWithdraw'](this.ownerPool)
          .then((tx: any) => {
            tx.wait()
              .then((receipt: any) => {
                console.log(
                  `Amount withdrawn in transaction ${receipt.transactionHash}`
                );
                alert(
                  `Amount withdrawn in transaction ${receipt.transactionHash}`
                );
                this.updateInfo();
              })
              .catch((err: any) => {
                alert(`Owner Withdraw Transaction: ${err}`);
                console.log(err);
              });
          })
          .catch((err: any) => {
            alert(`Owner Withdraw: ${err}`);
            console.log(err);
          });
    }
  }

  withdrawTokens() {
    let amount = prompt(
      `You have ${this.tokenBalance} tokens. \nHow much would you like to burn?`
    );

    if (isNaN(Number(amount))) {
      alert('Input must be a valid number');
      return;
    }

    if (amount && this.tokenBalance && this.contract && this.token && this.purchaseRatio) {
      let amountEth = ethers.utils.parseEther(amount);
      console.log(amountEth.toString());
        this.token['approve'](
          this.contract.address,
          ethers.constants.MaxUint256
        )
          .then((tx: any) => {
            tx.wait().then((receipt: any) => {
              console.log(`Allowance confirmed (${receipt.transactionHash})`);
              if (this.contract) {
                this.contract['returnTokens'](amountEth)
                  .then((tx: any) => {
                    tx.wait()
                      .then((receipt: any) => {
                        console.log(
                          `Amount withdrawn in transaction ${receipt.transactionHash}`
                        );
                        alert(
                          `Amount withdrawn in transaction ${receipt.transactionHash}`
                        );
                        this.updateInfo();
                      })
                      .catch((err: any) => {
                        alert(`Withdraw User Transaction: ${err}`);
                        console.log(err);
                      });
                  })
                  .catch((err: any) => {
                    alert(`Withdraw User: ${err}`);
                    console.log(err);
                  });
              }
            });
          })
          .catch((err: any) => {
            console.log(`Allowence: ${err}`);
            alert(`Allowence: ${err}`);
          });
    }
  }

  buyTokens() {
    let amount = prompt(
      `How many tokens would you like to be would you like to burn?`
    );

    if (isNaN(Number(amount))) {
      alert('Input must be a valid number');
      return;
    }

    if (amount && this.contract && this.purchaseRatio && this.ethBalance) {
      let amountEth = ethers.utils
        .parseEther(amount)
        .div(Number(this.purchaseRatio));
        this.contract['purchaseTokens']({
          value: amountEth,
        })
          .then((tx: any) => {
            tx.wait()
              .then((receipt: any) => {
                console.log(`Tokens purchased! (${receipt.transactionHash})`);
                alert(`Tokens purchased! (${receipt.transactionHash})`);
                this.updateInfo();
              })
              .catch((err: any) => {
                alert(`Purchase Transaction: ${err}`);
                console.log(err);
              });
          })
          .catch((err: any) => {
            alert(`Purchase: ${err}`);
            console.log(err);
          });
    }
  }

  bet() {
    let times = prompt(`How many tokens you want to bet?`);

    if (isNaN(Number(times))) {
      alert('Input must be a valid number');
      return;
    }

    if (this.token && this.contract && times) {
      this.token['approve'](this.contract.address, ethers.constants.MaxUint256)
        .then((tx: any) => {
          tx.wait().then((receipt: any) => {
            console.log(`Allowance confirmed (${receipt.transactionHash})`);
            if (this.contract) {
              this.contract['betMany'](times)
                .then((tx: any) => {
                  tx.wait()
                    .then((receipt: any) => {
                      console.log(`Bets placed! ${receipt.transactionHash}`);
                      alert(`Bets placed! ${receipt.transactionHash}`);
                      this.updateInfo();
                    })
                    .catch((err: any) => {
                      alert(`Bet Many Transaction: ${err}`);
                      console.log(err);
                    });
                })
                .catch((err: any) => {
                  alert(`Bet Many: ${err}`);
                  console.log(err);
                });
            }
          });
        })
        .catch((err: any) => {
          console.log(`Allowence: ${err}`);
          alert(`Allowence: ${err}`);
        });
    }
  }

  checkPrize() {
    if (this.contract && this.wallet) {
      this.contract['prize'](this.wallet.address).then((prizeBn: ethers.BigNumberish) => {
        this.prize = prizeBn.toString();
        alert(`You have a prize amount of: ${this.prize}`);
        console.log(`You have a prize amount of: ${this.prize}`);
      })
    }
  }

  withdrawPrize() {
    if (this.contract && this.wallet) {
      this.contract['prize'](this.wallet.address).then((prizeBn: ethers.BigNumberish) => {
        if (this.contract) {
          this.contract['prizeWithdraw'](prizeBn).then((tx: any) => {
            tx.wait().then((receipt: any) => {
              alert(`Prize Withdrawn (${receipt.transactionHash})`);
              console.log(`Prize Withdrawn (${receipt.transactionHash})`)
            }).catch((err: any) => {
              alert(`Prize Withdraw Transaction: ${err}`);
              console.log(`Prize Withdraw Transaction: ${err}`);
            })
          }).catch((err: any) => {
            alert(`Prize Withdraw: ${err}`);
            console.log(`Prize Withdraw: ${err}`);
          })
        }
      }).catch((err: any) => {
        alert(`Prize Check: ${err}`);
        console.log(`Prize Check: ${err}`)
      })
    }
  }
}

// async function claimPrize(index: string, amount: string) {
//   const tx = await contract
//     .connect(accounts[Number(index)])
//     .prizeWithdraw(ethers.utils.parseEther(amount));
//   const receipt = await tx.wait();
//   console.log(`Prize claimed (${receipt.transactionHash})\n`);
// }
