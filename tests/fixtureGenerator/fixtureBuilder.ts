let fs = require('fs');
let process = require('process');

function bindContract(web3, address: string, abiFile: string) {
  let jsonFile = `${process.cwd()}/abis/${abiFile}`;
  let parsed = JSON.parse(fs.readFileSync(jsonFile));
  let abi = parsed.abi;
  return new web3.Contract(abi, address);
}

/* This function is used to make calls that may trigger a revert. 
   If a revert occurs when using this function to make a call, the revert will be reflected in the final fixture. */
async function populateFixtureWithEthCall(
  fnName: string,
  fnSignature: string,
  blockNumber: string,
  method
) {
  let reverts = false;
  let value = '0';

  try {
    value = await method({}, blockNumber);
  } catch (e) {
    if (e.message != 'Returned error: execution reverted') {
      throw new Error(`Err: ${e}`);
    } else {
      reverts = true;
    }
  }

  return {
    fnName: fnName,
    fnSignature: fnSignature,
    value: [value],
    reverts: reverts,
  };
}

export async function buildVaultFixture(web3, address: string, block: string) {
  let vault = bindContract(web3, address, 'Vault.json');

  // these fixtures are consumed by the code generator to create createMockedFunction calls in AssemblyScript
  let fixture = {
    contractAddress: address,
    mockedFunctions: {
      totalSupply: {
        fnName: 'totalSupply',
        fnSignature: 'totalSupply():(uint256)',
        value: [await vault.methods.totalSupply().call({}, block)],
      },
      totalAssets: {
        fnName: 'totalAssets',
        fnSignature: 'totalAssets():(uint256)',
        value: [await vault.methods.totalAssets().call({}, block)],
      },
      totalDebt: {
        fnName: 'totalDebt',
        fnSignature: 'totalDebt():(uint256)',
        value: [await vault.methods.totalDebt().call({}, block)],
      },
      pricePerShare: {
        fnName: 'pricePerShare',
        fnSignature: 'pricePerShare():(uint256)',
        value: [await vault.methods.pricePerShare().call({}, block)],
      },
      performanceFee: {
        fnName: 'performanceFee',
        fnSignature: 'performanceFee():(uint256)',
        value: [await vault.methods.performanceFee().call({}, block)],
      },
      managementFee: {
        fnName: 'managementFee',
        fnSignature: 'managementFee():(uint256)',
        value: [await vault.methods.managementFee().call({}, block)],
      },
      activation: {
        fnName: 'activation',
        fnSignature: 'activation():(uint256)',
        value: [await vault.methods.activation().call({}, block)],
      },
      apiVersion: {
        fnName: 'apiVersion',
        fnSignature: 'apiVersion():(string)',
        value: [await vault.methods.apiVersion().call({}, block)],
      },
      token: {
        fnName: 'token',
        fnSignature: 'token():(address)',
        value: [await vault.methods.token().call({}, block)],
      },
      rewards: {
        fnName: 'rewards',
        fnSignature: 'rewards():(address)',
        value: [await vault.methods.rewards().call({}, block)],
      },
    },
  };
  return fixture;
}

export async function buildStrategyFixture(
  web3,
  address: string,
  block: string
) {
  let strategy = bindContract(web3, address, 'StrategyAPI.json');

  let fixture = {
    contractAddress: address,
    mockedFunctions: {
      doHealthCheck: await populateFixtureWithEthCall(
        'doHealthCheck',
        'doHealthCheck():(bool)',
        block,
        strategy.methods.doHealthCheck().call
      ),
      healthCheck: await populateFixtureWithEthCall(
        'healthCheck',
        'healthCheck():(address)',
        block,
        strategy.methods.healthCheck().call
      ),
      name: {
        fnName: 'name',
        fnSignature: 'name():(string)',
        value: [await strategy.methods.name().call({}, block)],
      },
      want: {
        fnName: 'want',
        fnSignature: 'want():(address)',
        value: [await strategy.methods.want().call({}, block)],
      },
      vault: {
        fnName: 'vault',
        fnSignature: 'vault():(address)',
        value: [await strategy.methods.vault().call({}, block)],
      },
    },
  };
  return fixture;
}

export async function buildERC20Fixture(
  web3,
  address: string,
  block: string,
  accounts
) {
  let token = bindContract(web3, address, 'ERC20Detailed.json');

  let account_balances = [];
  for (const i in accounts) {
    let balance = await token.methods.balanceOf(accounts[i]).call({}, block);

    account_balances.push({ params: [accounts[i]], retValue: [balance] });
  }

  let fixture = {
    contractAddress: address,
    mockedFunctions: {
      decimals: {
        fnName: 'decimals',
        fnSignature: 'decimals():(uint8)',
        value: [await token.methods.decimals().call({}, block)],
      },
      decimals_256: {
        fnName: 'decimals',
        fnSignature: 'decimals():(uint256)',
        value: [await token.methods.decimals().call({}, block)],
      },
      balanceOf: {
        fnName: 'balanceOf',
        fnSignature: 'balanceOf(address):(uint256)',
        cases: account_balances,
      },
      symbol: {
        fnName: 'symbol',
        fnSignature: 'symbol():(string)',
        value: [await token.methods.symbol().call({}, block)],
      },
      name: {
        fnName: 'name',
        fnSignature: 'name():(string)',
        value: [await token.methods.name().call({}, block)],
      },
    },
  };
  return fixture;
}

export async function buildOracleFixture(
  web3,
  address: string,
  block: string,
  token_address: string,
  quantities: string[]
) {
  let oracle = bindContract(web3, address, 'Oracle.json');

  let quantity_results = [];
  for (const i in quantities) {
    let g = 5;
    //let value = await oracle.methods.getNormalizedValueUsdc(token_address, quantities[i]).call({}, block);
    // todo: find out how this oracle fixture can be built dynamically based on block height.
    let value = '1';
    quantity_results.push({
      params: [token_address, quantities[i]],
      retValue: [value],
    });
  }

  //let recommended_price =  await oracle.methods.getPriceUsdcRecommended(token_address).call({}, block);
  let recommended_price = [{ params: [token_address], retValue: ['1000000'] }];

  let fixture = {
    contractAddress: address,
    mockedFunctions: {
      getNormalizedValueUsdc: {
        fnName: 'getNormalizedValueUsdc',
        fnSignature: 'getNormalizedValueUsdc(address,uint256):(uint256)',
        cases: quantity_results,
      },
      tryGetNormalizedValueUsdc: {
        fnName: 'try_getNormalizedValueUsdc',
        fnSignature: 'getNormalizedValueUsdc(address,uint256):(uint256)',
        cases: quantity_results,
      },
      getPriceUsdcRecommended: {
        fnName: 'getPriceUsdcRecommended',
        fnSignature: 'getPriceUsdcRecommended(address):(uint256)',
        cases: recommended_price,
      },
    },
  };
  return fixture;
}

/*
// WIP
async function buildTransactionFixture(web3, transactionId) {
  let transaction = await web3.getTransactionReceipt(transactionId);
  return transaction
}

async function buildEventFixture(web3, transactionId, logIndex) {
  let transaction = await web3.getTransactionReceipt(transactionId);
  let event = null;
  for(const i in transaction.logs) {
    
  }

  let fixture = {
    transaction: transaction
  }
}
*/
