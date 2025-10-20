import { IPathRepository } from '../../domain/interfaces/ipath-repository';

export class PathAppService {
  dirname(filePath: string) {
    return this.pathRepository.dirname(filePath);
  }
  resolve(...paths: string[]) {
    return this.pathRepository.resolve(...paths);
  }
  isAbsolute(rawFolderPath: string): boolean {
    return this.pathRepository.isAbsolute(rawFolderPath);
  }
  constructor(private readonly pathRepository: IPathRepository) {}

  join(...paths: string[]): string {
    return this.pathRepository.join(...paths);
  }
  basename(dirPath: string, suffix: string) {
    return this.pathRepository.basename(dirPath, suffix);
  }
}
