declare const sessionIdBrand: unique symbol;
export type SessionId = string & { readonly [sessionIdBrand]: true };

export function asSessionId(value: string): SessionId {
  return value as SessionId;
}
