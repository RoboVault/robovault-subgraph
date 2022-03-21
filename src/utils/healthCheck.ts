import { Address } from '@graphprotocol/graph-ts';
import { HealthCheck } from '../../generated/schema';

export function getOrCreateHealthCheck(address: Address): HealthCheck {
  let id = address.toHexString();
  let healthCheck = HealthCheck.load(id);
  if (healthCheck === null) {
    healthCheck = new HealthCheck(id);
    healthCheck.save();
  }
  return healthCheck;
}
