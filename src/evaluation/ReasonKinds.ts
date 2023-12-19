/**
 * Different kinds of error which may be encountered during evaluation.
 */
enum ReasonKinds {
  ClientNotReady = 'ClientNotReady',
  Off = 'Off',
  FallThrough = 'FallThrough',
  TargetMatch = 'TargetMatch',
  RuleMatch = 'RuleMatch',
  WrongType = 'WrongType',
  Error = 'Error'
}

export default ReasonKinds;