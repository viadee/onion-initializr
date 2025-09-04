import { OnionConfig } from '../Entities/OnionConfig';

export interface IOnionConfigRepository {
  save(data: OnionConfig, filename?: string): Promise<void>;
  loadInitialData(): Promise<OnionConfig>;
}
