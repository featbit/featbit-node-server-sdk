import { IContext } from "./Context";
import { FlagValue } from "../data/FlagValue";
import { EvaluationDetail } from "./EvaluationDetail";
import { IFlagsState } from "./FlagState";
import { IFlagsStateOptions } from "./FlagsStateOptions";

export interface IFeatBitClient {

    initialized(): boolean;

    waitForInitialization(): Promise<IFeatBitClient>;

    variation(
        key: string,
        context: IContext,
        defaultValue: FlagValue,
        callback?: (err: any, res: FlagValue) => void,
    ): Promise<FlagValue>;

    variationDetail(
        key: string,
        context: IContext,
        defaultValue: FlagValue,
        callback?: (err: any, res: EvaluationDetail) => void,
    ): Promise<EvaluationDetail>;

    allFlagsState(
        context: IContext,
        options?: IFlagsStateOptions,
        callback?: (err: Error | null, res: IFlagsState | null) => void,
    ): Promise<IFlagsState>;

    close(): void;

    isOffline(): boolean;

    track(key: string, context: IContext, data?: any, metricValue?: number): void;

    identify(context: IContext): void;

    flush(callback?: (err: Error | null, res: boolean) => void): Promise<void>;
}