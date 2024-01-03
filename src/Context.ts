import { IUser } from "./options/IUser";

export default class Context {
  private _user?: IUser;
  /**
   * Is this a valid context. If a valid context cannot be created, then this flag will be true.
   * The validity of a context should be tested before it is used.
   */
  public readonly valid: boolean;

  public readonly message?: string;

  /**
   * Contexts should be created using the static factory method {@link Context.fromLDContext}.
   * @param kind The kind of the context.
   *
   * The factory methods are static functions within the class because they access private
   * implementation details, so they cannot be free functions.
   */
  private constructor(valid: boolean, message?: string) {
    this.valid = valid;
    this.message = message;
  }

  public static fromUser(user: IUser): Context {
    if (!user) {
      return Context.contextForError('No user specified');
    }

    const {key, name} = user;

    if (key === undefined || key === null || key.trim() === '') {
      return Context.contextForError('key is mandatory');
    }

    const context = new Context(true);
    context._user = user;

    return context;
  }

  get user(): IUser {
    return this._user!;
  }

  get key(): string {
    return this._user!.key;
  }

  value(property: string): any {
    const propertyName = property as keyof IUser;
    return this._user?.[propertyName] ?? this._user?.customizedProperties?.find(x => x.name === propertyName)?.value;
  }

  private static contextForError(message: string) {
    return new Context(false, message);
  }
}