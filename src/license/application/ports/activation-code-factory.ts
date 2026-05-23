/**
 * Generates cryptographically random, human-typeable activation codes.
 * Output is returned in plaintext to the issuer once; never persisted in plaintext.
 */
export interface ActivationCodeFactory {
  generate(): string;
}
