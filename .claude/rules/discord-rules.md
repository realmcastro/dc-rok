# Discord Rules

## Purpose

Standards for everything in `src/discord/`. Owned by the `discord-integration` agent.

## Interaction model

- Slash commands only. No prefix commands. No message-content scraping.
- Application commands registered at startup against a known set; registrations are idempotent.
- Per-guild commands during development; global commands for release.

## Intents

- Minimum required. Default: `Guilds`, plus `GuildMembers` only if linking requires it.
- `MessageContent`, `GuildPresences`, `GuildVoiceStates`: forbidden without an ADR.

## Handler shape

Each command lives in `src/discord/commands/<command>/` with:

- `<command>.parser.ts` — interaction → typed domain input. Throws `InvalidInteractionError` on bad shape.
- `<command>.handler.ts` — orchestrates parser → use-case → presenter. ≤ ~50 lines.
- `<command>.presenter.ts` — domain result → embed/component.
- `<command>.test.ts` — unit tests against a fake use-case.

The handler:

```ts
export const fooHandler: SlashHandler = async (interaction, ctx) => {
  const correlationId = newCorrelationId();
  const log = ctx.log.child({ op: 'discord.foo', correlationId });
  try {
    const input = parseFoo(interaction);
    const result = await ctx.useCases.foo.run(input);
    await interaction.reply({ embeds: [presentFoo(result)], ephemeral: true });
    log.info({ outcome: 'ok' });
  } catch (e) {
    await replyError(interaction, e, correlationId);
    log.error({ err: e, outcome: 'error' });
  }
};
```

## Replies

- User-private data → `ephemeral: true`. Always.
- Long operations → `deferReply` within 3 seconds; follow up with `editReply`.
- Errors → friendly embed with a correlation id suffix; never raw exception text.

## Rate limits

- Trust the client library's rate limiter; do not retry tight loops.
- Bulk operations batch with explicit pacing.

## Permissions

- Per-command Discord permission requirements declared in the command builder.
- Admin commands additionally checked against the app's allow-list inside the handler.

## Presenters & embeds

- Embeds use a shared `embed()` builder for consistent colors, footer (correlation id), and timestamps.
- Components (buttons, selects) have stable custom IDs of the form `<feature>:<action>:<targetId>`.
- Component handlers also flow through parser → use-case → presenter.

## Forbidden

- `interaction.deferReply()` followed by a non-ephemeral leak.
- `MessageContent` intent.
- Looping over members or guilds at startup.
- Hard-coded guild or channel IDs in source.
- Embedding raw stack traces or secrets in messages.

## Enforcement

- `discord-integration` agent reviews every file under `src/discord/`.
- Handler length lint rule.
- A test exists that asserts each registered command has a handler.
