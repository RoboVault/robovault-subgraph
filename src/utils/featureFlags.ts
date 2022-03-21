import { log } from 'matchstick-as';

export function depositEventsSupported(vaultApiVersion: string): boolean {
  let lastVersionWithoutFeature = '0.4.3';
  return isVersionGreaterThan(vaultApiVersion, lastVersionWithoutFeature);
}

export function withdrawEventsSupported(vaultApiVersion: string): boolean {
  let lastVersionWithoutFeature = '0.4.3';
  return isVersionGreaterThan(vaultApiVersion, lastVersionWithoutFeature);
}

function isVersionGreaterThan(
  versionUnderScrutinity: string,
  lastVersionWithoutFeature: string
): boolean {
  let vUnderScrutinyComponents = versionUnderScrutinity.split('.');
  let lastUnsupportedVersionComponents = lastVersionWithoutFeature.split('.');

  const digitFields = 3;
  if (vUnderScrutinyComponents.length != digitFields) {
    log.error('A version number is being compared that is not supported: {}', [
      versionUnderScrutinity,
    ]);
  }

  for (let i = 0; i < digitFields; i++) {
    let scrunizedNum = parseInt(vUnderScrutinyComponents[i]);
    let minimumNum = parseInt(lastUnsupportedVersionComponents[i]);
    if (scrunizedNum > minimumNum) {
      return true;
    } else if (scrunizedNum < minimumNum) {
      return false;
    }
  }
  return false;
}
