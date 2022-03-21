import { clearStore, test, assert } from 'matchstick-as/assembly/index';
import {
  Address,
  log,
  BigInt,
  Bytes,
  ByteArray,
  ethereum,
} from '@graphprotocol/graph-ts';
import { createRegistryV1Entity } from './util/registryEvents';
import { createMockDeposit1Call } from './util/vaultCalls';
import { createMockNewVaultEvent } from './util/vaultEvents';
import { handleDepositWithAmount } from '../src/mappings/vaultMappings';
import { CreateMockUSDCVault_1 } from './fixtures/CreateMockUSDCVault_1';
import { AddStrategyToUSDCVault_2 } from './fixtures/AddStrategyToUSDCVault_2';
import { DepositToVaultWithSpecAmount_3 } from './fixtures/DepositToVaultWithSpecAmount_3';
import { WithdrawFromVaultWithSpecAmount_4 } from './fixtures/WithdrawFromVaultWithSpecAmount_4';
import { handleNewVaultInner } from '../src/mappings/registryMappings';
import {
  Vault as VaultSchema,
  Deposit as DepositSchema,
  Strategy as StrategySchema,
} from '../generated/schema';
import { BIGINT_MAX } from '../src/utils/constants';

let registry_address = Address.fromString(
  '0xa0c1a2ea0a861a967d9d0ffe2ae4012c2e053804'
);

test('https://github.com/yearn/yearn-vaults-v2-subgraph/issues/99', () => {
  // set up the chain state for the test
  clearStore();
  let registry = createRegistryV1Entity(registry_address);
  CreateMockUSDCVault_1.mockChainState();
  let vaultAddress = CreateMockUSDCVault_1.VaultAddress;
  let wantTokenAddress = CreateMockUSDCVault_1.WantTokenAddress;
  let apiVersion = '0.3.0';

  let mockEvent = createMockNewVaultEvent(
    Address.fromString(wantTokenAddress),
    1,
    Address.fromString(vaultAddress),
    apiVersion
  );
  handleNewVaultInner(registry_address, mockEvent);
  DepositToVaultWithSpecAmount_3.mockChainState();

  // chain state + subgraph entities are now set up. proceed to the test.
  let depositor = DepositToVaultWithSpecAmount_3.DepositorAddress;
  let sharesMinted = '79056085';
  let amountDeposited = BIGINT_MAX;
  let txnHash =
    '0xc1c33bd1a42e6c57134275be180376ef79d4e3b5a09162640ea3d01fb96e8ce6';

  let mockCall = createMockDeposit1Call(
    Bytes.fromByteArray(ByteArray.fromHexString(txnHash)),
    Address.fromString(vaultAddress),
    Address.fromString(depositor),
    BigInt.fromString(sharesMinted),
    amountDeposited
  );
  handleDepositWithAmount(mockCall);

  let transactionIndex = '1';
  let logIndex = '1';
  // from _getOrCreateTransaction
  let transactionHashId = txnHash.concat('-').concat(logIndex);

  // from deposit.buildIdFromAccountHashAndIndex
  let depositId = depositor
    .concat('-')
    .concat(transactionHashId)
    .concat('-')
    .concat(transactionIndex);

  // Verify Deposit amount is equal to sharesMinted, not BIGINT_MAX
  assert.fieldEquals('Deposit', depositId, 'tokenAmount', sharesMinted);
  clearStore();
});
