// A provider turns a natural-language prompt into a raw, UNVALIDATED rule object.
// Validation is the service's job, never the provider's.
export interface RuleProvider {
  readonly name: string;
  propose(prompt: string): Promise<unknown>;
}

export const PRIMARY_RULE_PROVIDER = 'PRIMARY_RULE_PROVIDER';
