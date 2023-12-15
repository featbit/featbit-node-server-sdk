import { IUser } from "./User";
import { FlagValue } from "../data/FlagValue";
import { EvalDetail } from "../evaluation/EvalDetail";
import { IFlagsState } from "./FlagState";
import { IFlagsStateOptions } from "./FlagsStateOptions";
import EventEmitter from "events";

export interface IFeatBitClient {

    initialized(): boolean;

    waitForInitialization(): Promise<IFeatBitClient>;

    boolVariation(
      key: string,
      user: IUser,
      defaultValue: boolean
    ): boolean;

    boolVariationDetail(
      key: string,
      user: IUser,
      defaultValue: any
    ): EvalDetail<boolean>;

    getAllVariations(
      user: IUser,
    ): EvalDetail<string>[];

    close(): void;

    isOffline(): boolean;

    track(key: string, context: IUser, data?: any, metricValue?: number): void;

    identify(context: IUser): void;

    flush(callback?: (err: Error | null, res: boolean) => void): Promise<void>;
}

export interface IFeatBitClientWithEvents extends IFeatBitClient, EventEmitter {
    /**
     *
     * Registers an event listener that will be called when the client triggers some type of event.
     *
     * This is the standard `on` method inherited from Node's `EventEmitter`; see the
     * {@link https://nodejs.org/api/events.html#events_class_eventemitter|Node API docs} for more
     * details on how to manage event listeners. Here is a description of the event types defined
     * by `LDClient`.
     *
     * - `"ready"`: Sent only once, when the client has successfully connected to LaunchDarkly.
     * Alternately, you can detect this with [[waitForInitialization]].
     * - `"failed"`: Sent only once, if the client has permanently failed to connect to LaunchDarkly.
     * Alternately, you can detect this with [[waitForInitialization]].
     * - `"error"`: Contains an error object describing some abnormal condition that the client has detected
     * (such as a network error).
     * - `"update"`: The client has received a change to a feature flag. The event parameter is an object
     * containing a single property, `key`, the flag key. Note that this does not necessarily mean the flag's
     * value has changed for any particular context, only that some part of the flag configuration was changed.
     * - `"update:KEY"`: The client has received a change to the feature flag whose key is KEY. This is the
     * same as `"update"` but allows you to listen for a specific flag.
     *
     * @param event the name of the event to listen for
     * @param listener the function to call when the event happens
     */
    on(event: string | symbol, listener: (...args: any[]) => void): this;
}