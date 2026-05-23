import type { ActivationCodeRepository } from '../../application/ports/activation-code-repository.js';
import { ActivationCode } from '../../domain/activation-code.js';
import type { ActivationCodeId, LicenseId } from '../../domain/license-id.js';

export class InMemoryActivationCodeRepository implements ActivationCodeRepository {
  private readonly byId = new Map<string, ActivationCode>();

  findById(id: ActivationCodeId): Promise<ActivationCode | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findByCodeHash(codeHash: string): Promise<ActivationCode | null> {
    for (const c of this.byId.values()) {
      if (c.toSnapshot().codeHash === codeHash) return Promise.resolve(c);
    }
    return Promise.resolve(null);
  }

  findByLicense(licenseId: LicenseId): Promise<ActivationCode[]> {
    return Promise.resolve(
      Array.from(this.byId.values()).filter((c) => c.licenseId === licenseId),
    );
  }

  findRedeemedByAccount(accountId: string): Promise<ActivationCode[]> {
    return Promise.resolve(
      Array.from(this.byId.values()).filter(
        (c) => c.toSnapshot().redeemedByAccountId === accountId,
      ),
    );
  }

  save(code: ActivationCode): Promise<void> {
    this.byId.set(code.id, code);
    return Promise.resolve();
  }

  count(): number {
    return this.byId.size;
  }
}
