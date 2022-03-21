import { Address, Bytes, log } from '@graphprotocol/graph-ts';
import * as featureFlags from '../../utils/featureFlags';
import * as vaultLibrary from '../../utils/vault/vault';
import { Vault as VaultContract } from '../../../generated/Registry/Vault';

/* 
Returns true if handling of the current deposit call should be skipped.
De-duplicates extra calls introduced when calling a vault via a proxy and skips calls being made against Vaults that support event-based deposits.
*/
export function shouldSkipDepositCall(
  callTo: Address,
  callFrom: Address,
  txnHash: Bytes
): boolean {
  if (vaultLibrary.isVault(callTo) && vaultLibrary.isVault(callFrom)) {
    log.warning(
      '[Vault Call Filter] Deposit () - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing deposit tx.',
      [txnHash.toHexString(), callTo.toHexString(), callFrom.toHexString()]
    );
    return true;
  }

  let vaultContract = VaultContract.bind(callTo);
  let vaultApiVersion = vaultContract.try_apiVersion();
  if (vaultApiVersion.reverted) {
    log.info(
      '[Vault Call Filter] Vault {} has triggered a call handler, but the contract does not implement .apiVersion(). Skipping',
      [callFrom.toHexString()]
    );
    return true;
  }
  if (featureFlags.depositEventsSupported(vaultApiVersion.value)) {
    log.info(
      '[Vault Call Filter] Vault {} supports event-based deposits. Skipping call handler.',
      [callTo.toHexString()]
    );
    return true;
  }
  return false;
}

/* 
Returns true if handling of the current withdraw call should be skipped.
De-duplicates extra calls introduced when calling a vault via a proxy and skips calls being made against Vaults that support event-based withdrawl.
*/
export function shouldSkipWithdrawCall(
  callTo: Address,
  callFrom: Address,
  txnHash: Bytes
): boolean {
  if (vaultLibrary.isVault(callTo) && vaultLibrary.isVault(callFrom)) {
    log.warning(
      '[Vault Call Filter] Withdraw (shares) - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing withdraw tx.',
      [txnHash.toHexString(), callTo.toHexString(), callFrom.toHexString()]
    );
    return true;
  }

  let vaultContract = VaultContract.bind(callTo);
  let vaultApiVersion = vaultContract.try_apiVersion();
  if (vaultApiVersion.reverted) {
    log.info(
      '[Vault Call Filter] Vault {} has triggered a call handler, but the contract does not implement .apiVersion(). Skipping',
      [callFrom.toHexString()]
    );
    return true;
  }
  if (featureFlags.withdrawEventsSupported(vaultApiVersion.value)) {
    log.info(
      '[Vault Call Filter] Vault {} supports event-based withdrawals. Skipping call handler.',
      [callTo.toHexString()]
    );
    return true;
  }
  return false;
}
