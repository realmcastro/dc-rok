/**
 * ID generator. Domain code never imports the `ulid` package directly.
 */
export interface IdGenerator {
  next(): string;
}
