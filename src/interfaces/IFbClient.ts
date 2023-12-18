import { IUser } from "../options/IUser";
import { IEvalDetail } from "../evaluation/IEvalDetail";

export interface IFbClient {

    initialized(): boolean;

    waitForInitialization(): Promise<IFbClient>;

    boolVariation(
      key: string,
      user: IUser,
      defaultValue: boolean
    ): boolean;

    boolVariationDetail(
      key: string,
      user: IUser,
      defaultValue: boolean
    ): IEvalDetail<boolean>;

    numberVariation(
      key: string,
      user: IUser,
      defaultValue: number
    ): number;

    stringVariationDetail(
      key: string,
      user: IUser,
      defaultValue: string
    ): IEvalDetail<string>;

    stringVariation(
      key: string,
      user: IUser,
      defaultValue: string
    ): string;

    numberVariationDetail(
      key: string,
      user: IUser,
      defaultValue: number
    ): IEvalDetail<number>;

    jsonVariation(
      key: string,
      user: IUser,
      defaultValue: unknown
    ): unknown;

    jsonVariationDetail(
      key: string,
      user: IUser,
      defaultValue: unknown
    ): IEvalDetail<unknown>;

    getAllVariations(
      user: IUser,
    ): IEvalDetail<string>[];

    close(): Promise<void>;

    isOffline(): boolean;

    track(user: IUser, eventName: string, metricValue?: number | undefined): void

    flush(callback?: (res: boolean) => void): Promise<boolean>;
}