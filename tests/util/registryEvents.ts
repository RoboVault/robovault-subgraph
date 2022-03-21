import { assert } from 'matchstick-as/assembly/index';
import { Registry as RegistrySchema } from '../../generated/schema';
import { handleNewReleaseInner } from '../../src/mappings/registryMappings';
import { BigInt, ethereum, log, Address } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';
import { NewRelease } from '../../generated/Registry/Registry';
import { defaults } from '../default';

export function createMockNewReleaseEvent(
  release_id: i32,
  template: string,
  api_version: string
): NewRelease {
  let mockEvent = newMockEvent();
  let newReleaseEvent = new NewRelease(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );
  newReleaseEvent.parameters = new Array();

  let release_idParam = new ethereum.EventParam(
    'release_id',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(release_id))
  );
  let templateParam = new ethereum.EventParam(
    'template',
    ethereum.Value.fromAddress(Address.fromString(template))
  );
  let api_versionParam = new ethereum.EventParam(
    'api_version',
    ethereum.Value.fromString(api_version)
  );

  newReleaseEvent.parameters.push(release_idParam);
  newReleaseEvent.parameters.push(templateParam);
  newReleaseEvent.parameters.push(api_versionParam);

  return newReleaseEvent;
}

export function createRegistryV1Entity(
  registryAddress: Address
): RegistrySchema {
  log.info('[TEST] Creating mocked NewReleaseEvent', ['']);
  let release_id = defaults.i32;
  let template_address = defaults.addressString;
  let api_version = defaults.string;

  let mockEvent = createMockNewReleaseEvent(
    release_id,
    template_address,
    api_version
  );

  log.info('[TEST] Calling handleNewReleaseInner with mocked event', []);
  handleNewReleaseInner(registryAddress, mockEvent);

  let registry = RegistrySchema.load(registryAddress.toHexString());
  assert.assertNotNull(registry);
  return registry as RegistrySchema;
}
