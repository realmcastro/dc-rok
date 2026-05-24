import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://app:apppass@localhost:5432/dcrok?schema=public',
});

async function main(): Promise<void> {
  const licenseId = crypto.randomUUID().replace(/-/g, '').slice(0, 26).toUpperCase();
  const codeId = crypto.randomUUID().replace(/-/g, '').slice(0, 26).toUpperCase();
  const plainCode = 'TEST-CODE-12345';

  const pepper = '569330b53b921e5d641eb7ec25ce0eb2a2741dce2292c0655d1eac28a2499b40';
  const hash = crypto.createHmac('sha256', pepper).update(plainCode).digest('hex');

  const now = new Date();
  const expiresAt = new Date('2027-12-31T23:59:59Z');

  const keyHash = crypto.createHmac('sha256', pepper).update(licenseId).digest('hex');

  await prisma.license.create({
    data: {
      id: licenseId,
      keyHash,
      status: 'ACTIVE',
      expiresAt,
      maxActivations: 5,
      currentActivations: 0,
      createdBy: 'system-seed',
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.activationCode.create({
    data: {
      id: codeId,
      codeHash: hash,
      licenseId: licenseId,
      redeemedAt: null,
      redeemedByAccountId: null,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log('License ID:', licenseId);
  console.log('Activation code:', plainCode);
  console.log('Use /init with code:', plainCode);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
