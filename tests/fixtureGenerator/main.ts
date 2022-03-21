import {
  convertFixturesToAssemblyScript,
  writeFixtureScriptFile,
} from './codeGeneration';
import {
  buildERC20Fixture,
  buildVaultFixture,
  buildStrategyFixture,
  buildOracleFixture,
} from './fixtureBuilder';

let fs = require('fs');
let path = require('path');
let Web3 = require('web3-eth');

async function main() {
  // Must be an archive node.
  let config = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../config.json'))
  );
  let w3 = new Web3(config.nodeUrl);
  w3.handleRevert = true;

  let vaultAddress = '0x5f18c75abdae578b483e5f43f12a39cf75b973a9';
  let wantTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  let treasuryAddress = '0x93a62da5a14c80f265dabc077fcee437b1a0efde';
  await createUSDCVault_1(w3, vaultAddress, wantTokenAddress);
  await addStrategyToUSDCVault_2(w3, vaultAddress);

  let depositor = '0x253c5cbdd08838dad5493d511e17aa1ac5eab51b';
  await depositToUSDCVault_3(w3, vaultAddress, wantTokenAddress, depositor);
  await withdrawFromVaultWithSpecAmount_4(
    w3,
    vaultAddress,
    wantTokenAddress,
    depositor
  );
  let strategyAddress = '0x4d7d4485fd600c61d840ccbec328bfd76a050f87';
  await harvestStrategy_4(
    w3,
    vaultAddress,
    wantTokenAddress,
    strategyAddress,
    treasuryAddress
  );
}

/* Intended to mock the chain state for testing https://etherscan.io/tx/0x03810d161c9d156415b307e4bc72ede7e3b2df801c8160ce6c4e5ba8e7d9a4c7 */
async function harvestStrategy_4(
  w3,
  vaultAddress: string,
  wantTokenAddress: string,
  strategyAddress: string,
  treasuryAddress: string
) {
  let block = '11685275';
  let mockName = 'HarvestStrategy_4';
  let oracleAddress = '0x83d95e0d5f402511db06817aff3f9ea88224b030';

  let vault = await buildVaultFixture(w3, vaultAddress, block);
  let strategy = await buildStrategyFixture(w3, strategyAddress, block);

  let usdcOracle = await buildOracleFixture(
    w3,
    oracleAddress,
    block,
    wantTokenAddress,
    ['33043378', '3304410', '16569793']
  );
  let wantErc20 = await buildERC20Fixture(w3, wantTokenAddress, block, [
    vaultAddress,
    strategyAddress,
  ]);

  let vaultShareErc20 = await buildERC20Fixture(w3, vaultAddress, block, [
    vaultAddress,
    strategyAddress,
    treasuryAddress,
  ]);

  let fixtures = [vault, strategy, wantErc20, vaultShareErc20, usdcOracle];

  let extraVariableDecls = {
    VaultAddress: vaultAddress,
    WantTokenAddress: wantTokenAddress,
    Block: block,
    StrategyAddress: strategyAddress,
    PricePerShare: vault.mockedFunctions.pricePerShare.value[0],
    TreasuryAddress: treasuryAddress,
  };

  let script = convertFixturesToAssemblyScript(
    mockName,
    fixtures,
    [],
    [],
    extraVariableDecls
  );

  writeFixtureScriptFile(mockName, script);
}

/* Intended to mock the chain state for testing https://etherscan.io/tx/0xfbe5fe8f992480569f67f96dc35af74dfd38b0c20cae2e7cd9d949d9629e997b */
async function withdrawFromVaultWithSpecAmount_4(
  w3,
  vaultAddress: string,
  wantTokenAddress: string,
  depositor: string
) {
  let block = '11680761';
  let mockName = 'WithdrawFromVaultWithSpecAmount_4';

  let vault = await buildVaultFixture(w3, vaultAddress, block);
  let vaultErc20 = await buildERC20Fixture(w3, vaultAddress, block, [
    depositor,
  ]);

  let wantErc20 = await buildERC20Fixture(w3, wantTokenAddress, block, [
    depositor,
    vaultAddress,
  ]);

  let fixtures = [vault, vaultErc20, wantErc20];
  let extraVariableDecls = {
    VaultAddress: vaultAddress,
    WantTokenAddress: wantTokenAddress,
    Block: block,
    DepositorAddress: depositor,
  };

  let script = convertFixturesToAssemblyScript(
    mockName,
    fixtures,
    [],
    [],
    extraVariableDecls
  );

  writeFixtureScriptFile(mockName, script);
}

/* Intended to mock the chain state so we can test https://etherscan.io/tx/0xc1c33bd1a42e6c57134275be180376ef79d4e3b5a09162640ea3d01fb96e8ce6 */
async function depositToUSDCVault_3(
  w3,
  vaultAddress: string,
  wantTokenAddress: string,
  depositor: string
) {
  let block = '11680659';
  let mockName = 'DepositToVaultWithSpecAmount_3';
  let oracleAddress = '0x83d95e0d5f402511db06817aff3f9ea88224b030';

  let vault = await buildVaultFixture(w3, vaultAddress, block);
  let vaultErc20 = await buildERC20Fixture(w3, vaultAddress, block, [
    depositor,
  ]);

  let wantErc20 = await buildERC20Fixture(w3, wantTokenAddress, block, [
    depositor,
    vaultAddress,
  ]);

  let oracle = await buildOracleFixture(
    w3,
    oracleAddress,
    block,
    wantTokenAddress,
    ['1']
  );
  let fixtures = [vault, vaultErc20, wantErc20, oracle];
  let extraVariableDecls = {
    VaultAddress: vaultAddress,
    WantTokenAddress: wantTokenAddress,
    Block: block,
    DepositorAddress: depositor,
    OracleAddress: oracleAddress,
  };

  let script = convertFixturesToAssemblyScript(
    mockName,
    fixtures,
    [],
    [],
    extraVariableDecls
  );

  writeFixtureScriptFile(mockName, script);
}

/* Intended to mock the chain state so we can test https://etherscan.io/tx/0x3e059ed2652468576e10ea90bc1c3fcf2f125bbdb31c2f9063cb5108c68e1c59 */
async function addStrategyToUSDCVault_2(w3, vaultAddress) {
  let block = '11674514';
  let mockName = 'AddStrategyToUSDCVault_2';
  let strategyAddress = '0x4d7d4485fd600c61d840ccbec328bfd76a050f87';

  let vault = await buildVaultFixture(w3, vaultAddress, block);
  let strategy = await buildStrategyFixture(w3, strategyAddress, block);

  let fixtures = [vault, strategy];
  let extraVariableDecls = {
    VaultAddress: vaultAddress,
    StrategyAddress: strategyAddress,
    Block: block,
  };
  let script = convertFixturesToAssemblyScript(
    mockName,
    fixtures,
    [],
    [],
    extraVariableDecls
  );

  writeFixtureScriptFile(mockName, script);
}

async function createUSDCVault_1(w3, vaultAddress, wantTokenAddress) {
  let block = '11674456';
  let mockName = 'CreateMockUSDCVault_1';

  let vault = await buildVaultFixture(w3, vaultAddress, block);
  let vaultErc20 = await buildERC20Fixture(w3, vaultAddress, block, []);

  let wantTokenErc20 = await buildERC20Fixture(w3, wantTokenAddress, block, []);

  let fixtures = [vault, vaultErc20, wantTokenErc20];
  let extraVariableDecls = {
    VaultAddress: vaultAddress,
    WantTokenAddress: wantTokenAddress,
    Block: block,
  };

  let script = convertFixturesToAssemblyScript(
    mockName,
    fixtures,
    [],
    [],
    extraVariableDecls
  );

  writeFixtureScriptFile(mockName, script);
}

main();
