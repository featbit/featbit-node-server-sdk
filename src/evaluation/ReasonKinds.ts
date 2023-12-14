/**
 * Different kinds of error which may be encountered during evaluation.
 */
enum ReasonKinds {
  ClientNotReady = 'ClientNotReady',
  Off = 'Off',
  FallThrough = 'FallThrough',
  TargetMatch = 'TargetMatch',
  RuleMatch = 'RuleMatch',
  //MalformedFlag = 'MALFORMED_FLAG',
  //UserNotSpecified = 'UserNotSpecified',
  //FlagNotFound = 'FlagNotFound',

  WrongType = 'WrongType',
  Error = 'Error'
}

export default ReasonKinds;