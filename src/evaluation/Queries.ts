import { ISegment } from "./data/Segment";
import { IFlag } from "./data/Flag";

/**
 * This interface is used by the evaluator to query data it may need during
 * an evaluation.
 *
 * @internal
 */
export interface Queries {
  getFlag(key: string): IFlag | null;
  getSegment(key: string): ISegment | null;
}
