import type { LicenseRepository } from '../../application/ports/license-repository.js';
import type { LicenseId } from '../../domain/license-id.js';
import { License } from '../../domain/license.js';

export class InMemoryLicenseRepository implements LicenseRepository {
  private readonly byId = new Map<string, License>();

  findById(id: LicenseId): Promise<License | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findByKeyHash(keyHash: string): Promise<License | null> {
    for (const l of this.byId.values()) {
      if (l.toSnapshot().keyHash === keyHash) return Promise.resolve(l);
    }
    return Promise.resolve(null);
  }

  save(license: License): Promise<void> {
    this.byId.set(license.id, license);
    return Promise.resolve();
  }

  /** Test helper. */
  count(): number {
    return this.byId.size;
  }
}
