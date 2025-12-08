import { IPathRepository } from '@onion-initializr/lib/domain/interfaces/ipath-repository';
import path from 'node:path';
export class PathRepository implements IPathRepository {
  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  resolve(...paths: string[]): string {
    return path!.resolve(...paths);
  }

  isAbsolute(rawFolderPath: string): boolean {
    return path!.isAbsolute(rawFolderPath);
  }

  public join(...paths: string[]): string {
    return path!.join(...paths);
  }

  public basename(dirPath: string, suffix: string): string {
    return path!.basename(dirPath, suffix);
  }
}
