/**
 * Different kinds of error which may be encountered during evaluation.
 */
export enum ReasonKinds {
  ClientNotReady = 'ClientNotReady',
  Off = 'Off',
  FallThrough = 'FallThrough',
  TargetMatch = 'TargetMatch',
  RuleMatch = 'RuleMatch',
  WrongType = 'WrongType',
  Error = 'Error'
}