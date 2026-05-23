declare const licenseIdBrand: unique symbol;
export type LicenseId = string & { readonly [licenseIdBrand]: true };

export function asLicenseId(value: string): LicenseId {
  return value as LicenseId;
}

declare const activationCodeIdBrand: unique symbol;
export type ActivationCodeId = string & { readonly [activationCodeIdBrand]: true };

export function asActivationCodeId(value: string): ActivationCodeId {
  return value as ActivationCodeId;
}
