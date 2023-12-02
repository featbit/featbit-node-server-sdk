export type Op =
  | 'in'
  | 'startsWith'
  | 'endsWith'
  | 'contains'
  | 'matches'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'before'
  | 'after'
  | 'segmentMatch'
  | 'semVerEqual'
  | 'semVerGreaterThan'
  | 'semVerLessThan';

export interface IClause {
  attribute: string;
  negate?: boolean;
  op: Op;
  values: any[];
  contextKind?: string;
}
