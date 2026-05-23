/**
 * Branded type for correlation IDs propagated across an interaction.
 *
 * Generated at the interaction boundary, attached to every log line and
 * every audit event. The last 6 chars are shown to the user in error embeds.
 */
declare const correlationIdBrand: unique symbol;
export type CorrelationId = string & { readonly [correlationIdBrand]: true };

export function asCorrelationId(value: string): CorrelationId {
  return value as CorrelationId;
}

export function shortCorrelation(id: CorrelationId): string {
  return id.slice(-6);
}
