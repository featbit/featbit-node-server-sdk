import { IUser } from "./IUser";

/**
 * Creates an instance of the FeatBit user.
 *
 * @return
 *   The new {@link IUser} instance.
 */
export class UserBuilder {
  private _user: IUser;

  constructor() {
    this._user = {
      name: '',
      key: '',
      customizedProperties: []
    };
  }

  anonymous(name: string = 'anonymous', key: string = 'anonymous'): UserBuilder {
    this._user.name = name;
    this._user.key = key;
    return this;
  }

  name(name: string): UserBuilder {
    this._user.name = name;
    return this;
  }

  key(key: string): UserBuilder {
    this._user.key = key;
    return this;
  }

  custom(propertyName: string, value: string): UserBuilder {

    this._user.customizedProperties?.push({ name: propertyName, value: value });
    return this;
  }

  build(): IUser {
    return this._user;
  }
}