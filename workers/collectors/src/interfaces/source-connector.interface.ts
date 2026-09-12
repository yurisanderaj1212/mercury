import type { RawPublication, NormalizedPublication } from './pipeline.interface';

export interface SourceConnector {
  readonly sourceName: string;
  collect(): Promise<RawPublication[]>;
  normalize(raw: RawPublication): Promise<NormalizedPublication>;
  validate(data: NormalizedPublication): Promise<boolean>;
}
