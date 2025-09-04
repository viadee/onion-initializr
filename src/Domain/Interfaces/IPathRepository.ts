export interface IPathRepository {
  dirname(filePath: string): string;
  resolve(...paths: string[]): string;
  basename(dirPath: string, suffix: string): string;
  join(...paths: string[]): string;
  isAbsolute(rawFolderPath: string): boolean;
}
