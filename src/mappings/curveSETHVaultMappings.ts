import { log } from '@graphprotocol/graph-ts';
import {
  Vault as VaultContract,
  UpdatePerformanceFee as UpdatePerformanceFeeEvent,
  UpdateManagementFee as UpdateManagementFeeEvent,
  StrategyAdded1 as StrategyAddedV2Event,
} from '../../generated/Registry/Vault';
import { isEventBlockNumberLt } from '../utils/commons';
import {
  BIGINT_ZERO,
  CURVE_SETH_VAULT_END_BLOCK_CUSTOM,
} from '../utils/constants';
import * as strategyLibrary from '../utils/strategy/strategy';
import {
  getOrCreateTransactionFromCall,
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as vaultLibrary from '../utils/vault/vault';

/**
 * The strategy for this vault wasn't processed  using the registry because the strategy was added before the vault was registered.

  https://etherscan.io/token/0x986b4aff588a109c09b50a03f42e4110e29d353f (eCRV/yveCRV)

  AddStrategy (#11870118): https://etherscan.io/tx/0xaf8b9cb986a216e5191b0d704ee208dd5d9e111911c6b63d90cc406bb76f3d19
  Regsitered (#11881934): https://etherscan.io/tx/0xc62c06623c4ccdefd360e0c197107c97d6c95be0cef64125043c2c9349879dfb

  This custom handler, handle the new strategies in that block range. 
 */
/* This version of the AddStrategy event is used in vaults 0.3.2 and up */
export function handleStrategyAddedV2(event: StrategyAddedV2Event): void {
  if (
    isEventBlockNumberLt(
      'CurveSETHVault_AddStrategyV2Event',
      event.block,
      CURVE_SETH_VAULT_END_BLOCK_CUSTOM
    )
  ) {
    let transaction = getOrCreateTransactionFromEvent(
      event,
      'CurveSETHVault_AddStrategyV2Event'
    );
    strategyLibrary.createAndGet(
      transaction.id,
      event.params.strategy,
      event.address,
      event.params.debtRatio,
      BIGINT_ZERO,
      event.params.minDebtPerHarvest,
      event.params.maxDebtPerHarvest,
      event.params.performanceFee,
      null,
      transaction
    );
  }
}

export function handleUpdatePerformanceFee(
  event: UpdatePerformanceFeeEvent
): void {
  if (
    isEventBlockNumberLt(
      'CurveSETHVault_UpdatePerformanceFeeEvent',
      event.block,
      CURVE_SETH_VAULT_END_BLOCK_CUSTOM
    )
  ) {
    let ethTransaction = getOrCreateTransactionFromEvent(
      event,
      'UpdatePerformanceFee'
    );

    let vaultContract = VaultContract.bind(event.address);

    vaultLibrary.performanceFeeUpdated(
      event.address,
      ethTransaction,
      vaultContract,
      event.params.performanceFee
    );
  }
}

export function handleUpdateManagementFee(
  event: UpdateManagementFeeEvent
): void {
  if (
    isEventBlockNumberLt(
      'CurveSETHVault_UpdateManagementFeeEvent',
      event.block,
      CURVE_SETH_VAULT_END_BLOCK_CUSTOM
    )
  ) {
    let ethTransaction = getOrCreateTransactionFromEvent(
      event,
      'UpdateManagementFee'
    );

    let vaultContract = VaultContract.bind(event.address);

    vaultLibrary.managementFeeUpdated(
      event.address,
      ethTransaction,
      vaultContract,
      event.params.managementFee
    );
  }
}
