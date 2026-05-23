import type { PrismaClient } from '@prisma/client';

import {
  LinkAccount,
  LookupAccountByDiscordUser,
  PrismaAccountRepository,
  PrismaLinkUnitOfWork,
} from '../account-link/index.js';
import type { Env } from '../config/index.js';
import {
  HmacLicenseHasher,
  IssueLicense,
  LicenseValidationService,
  PrismaActivationCodeRepository,
  PrismaLicenseRepository,
  PrismaLicenseUnitOfWork,
  RandomActivationCodeFactory,
  RedeemActivationCode,
  RedeemInContext,
  RevokeLicense,
} from '../license/index.js';
import {
  GetSessionStatus,
  NoopAgentRuntime,
  PrismaSessionRepository,
  PrismaSessionUnitOfWork,
  StartSession,
  StopSession,
} from '../session/index.js';
import {
  createPinoLogger,
  SystemClock,
  UlidIdGenerator,
  type Clock,
  type IdGenerator,
  type Logger,
} from '../shared/index.js';

export interface Container {
  readonly env: Env;
  readonly log: Logger;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly prisma: PrismaClient;
  readonly useCases: {
    readonly issueLicense: IssueLicense;
    readonly revokeLicense: RevokeLicense;
    readonly redeemActivationCode: RedeemActivationCode;
    readonly linkAccount: LinkAccount;
    readonly lookupAccount: LookupAccountByDiscordUser;
    readonly startSession: StartSession;
    readonly stopSession: StopSession;
    readonly getSessionStatus: GetSessionStatus;
  };
}

export interface BuildContainerInput {
  readonly env: Env;
  readonly prisma: PrismaClient;
}

export function buildContainer(input: BuildContainerInput): Container {
  const log = createPinoLogger({
    level: input.env.LOG_LEVEL,
    pretty: input.env.NODE_ENV === 'development',
    base: { service: 'dc-rok', env: input.env.NODE_ENV },
  });
  const clock = new SystemClock();
  const ids = new UlidIdGenerator();

  const hasher = new HmacLicenseHasher(input.env.LICENSE_HASH_PEPPER);
  const codeFactory = new RandomActivationCodeFactory();

  const licenseRepo = new PrismaLicenseRepository(input.prisma);
  const activationCodeRepo = new PrismaActivationCodeRepository(input.prisma);
  const licenseUow = new PrismaLicenseUnitOfWork(input.prisma);
  const linkUow = new PrismaLinkUnitOfWork(input.prisma, ids, clock);
  const sessionUow = new PrismaSessionUnitOfWork(input.prisma, ids, clock);

  const accountRepo = new PrismaAccountRepository(input.prisma);
  const sessionRepo = new PrismaSessionRepository(input.prisma);
  const licenseValidator = new LicenseValidationService(licenseRepo, activationCodeRepo);
  const agentRuntime = new NoopAgentRuntime(log);

  const issueLicense = new IssueLicense({
    licenses: licenseRepo,
    codes: activationCodeRepo,
    hasher,
    codeFactory,
    ids,
    clock,
    log,
  });
  const revokeLicense = new RevokeLicense({ licenses: licenseRepo, clock, log });
  const redeemActivationCode = new RedeemActivationCode({
    uow: licenseUow,
    hasher,
    clock,
    log,
  });
  const redeemInContext = new RedeemInContext({ hasher, clock });

  const linkAccount = new LinkAccount({
    uow: linkUow,
    redeemInContext,
    ids,
    clock,
    log,
  });
  const lookupAccount = new LookupAccountByDiscordUser(accountRepo);

  const startSession = new StartSession({
    uow: sessionUow,
    licenseValidator,
    agentRuntime,
    ids,
    clock,
    log,
  });
  const stopSession = new StopSession({
    uow: sessionUow,
    licenseValidator,
    agentRuntime,
    clock,
    log,
  });
  const getSessionStatus = new GetSessionStatus({
    sessions: sessionRepo,
    licenseValidator,
    clock,
  });

  return {
    env: input.env,
    log,
    clock,
    ids,
    prisma: input.prisma,
    useCases: {
      issueLicense,
      revokeLicense,
      redeemActivationCode,
      linkAccount,
      lookupAccount,
      startSession,
      stopSession,
      getSessionStatus,
    },
  };
}
