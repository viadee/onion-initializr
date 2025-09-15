// Only import path for Node.js usage
let path: typeof import('path') | undefined;

import { IPathRepository } from '../../../../lib/Domain/Interfaces/IPathRepository';

export class PathRepository implements IPathRepository {
  dirname(filePath: string): string {
    path ??= require('path');
    return path!.dirname(filePath);
  }

  resolve(...paths: string[]): string {
    path ??= require('path');
    return path!.resolve(...paths);
  }

  isAbsolute(rawFolderPath: string): boolean {
    path ??= require('path');
    return path!.isAbsolute(rawFolderPath);
  }

  public join(...paths: string[]): string {
    path ??= require('path');
    return path!.join(...paths);
  }

  public basename(dirPath: string, suffix: string): string {
    path ??= require('path');
    return path!.basename(dirPath, suffix);
  }
}
