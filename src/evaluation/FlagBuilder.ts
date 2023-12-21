// used only by tests
import { IFlag } from "./data/IFlag";
import { IVariation } from "./data/IVariation";
import { ITargetUser } from "./data/ITargetUser";
import { ITargetRule } from "./data/IRule";
import { IFallthrough } from "./data/IFallthrough";
import { EmptyString } from "../constants";

export class FlagBuilder {
  private _id: string = `xxxxx-${new Date().getTime()}-xxxxxx`;
  private _key?: string;
  private _version?: number;
  private _variationType: string = EmptyString;
  private _variations: IVariation[] = [];
  private _targetUsers: ITargetUser[] = [];
  private _rules: ITargetRule[] = [];
  private _isEnabled: boolean = true;
  private _disabledVariationId: string = EmptyString;
  private _fallthrough?: IFallthrough;
  private _exptIncludeAllTargets: boolean = true;

  id(id: string): FlagBuilder {
    this._id = id;
    return this;
  }

  key(key: string): FlagBuilder {
    this._key = key;
    return this;
  }

  version(version: number): FlagBuilder {
    this._version = version
    return this;
  }

  variationType(variationType: string): FlagBuilder {
    this._variationType = variationType
    return this;
  }

  variations(variations: IVariation[]): FlagBuilder {
    this._variations = variations
    return this;
  }

  targetUsers(targetUsers: ITargetUser[]): FlagBuilder {
    this._targetUsers = targetUsers
    return this;
  }

  rules(rules: ITargetRule[]): FlagBuilder {
    this._rules = rules
    return this;
  }

  isEnabled(isEnabled: boolean): FlagBuilder {
    this._isEnabled = isEnabled
    return this;
  }

  disabledVariationId(disabledVariationId: string): FlagBuilder {
    this._disabledVariationId = disabledVariationId
    return this;
  }

  fallthrough(fallthrough: IFallthrough): FlagBuilder {
    this._fallthrough = fallthrough
    return this;
  }

  exptIncludeAllTargets(exptIncludeAllTargets: boolean): FlagBuilder {
    this._exptIncludeAllTargets = exptIncludeAllTargets
    return this;
  }

  build(): IFlag {
    return {
      id: this._id!,
      key: this._key!,
      version: this._version!,
      variationType: this._variationType,
      variations: this._variations,
      targetUsers: this._targetUsers,
      rules: this._rules,
      isEnabled: this._isEnabled,
      disabledVariationId: this._disabledVariationId,
      fallthrough: this._fallthrough!,
      exptIncludeAllTargets: this._exptIncludeAllTargets,
      updatedAt: new Date().toISOString()
    };
  }
}