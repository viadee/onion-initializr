import { OnionConfig } from '../../Domain/Entities/OnionConfig';
import { IOnionConfigRepository } from '../../Domain/Interfaces/IOnionConfigRepository';
import initialData from '../onionData.json';

export class OnionConfigRepository implements IOnionConfigRepository {
  public async loadInitialData(): Promise<OnionConfig> {
    // Load initial data from JSON file
    return initialData as OnionConfig;
  }

  public async save(
    data: OnionConfig,
    filename: string = 'onion-config.json'
  ): Promise<void> {
    const jsonStr = JSON.stringify(data, null, 2); // pretty-print with indentation
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
