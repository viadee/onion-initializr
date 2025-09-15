import { FileEntity } from '../../../../lib/Domain/Entities/FileEntity';

export interface IFileRepository {
  readTemplate(templatePath: string): Promise<FileEntity>;
  clearBrowserFiles(): void;
  getBrowserFiles(): string[];
  rmSync(appDir: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  dirExists(dirPath: string): Promise<boolean>;
  read(path: string): Promise<FileEntity>;
  fileExists(filePath: string): Promise<boolean>;
  createDirectory(dirPath: string): Promise<void>;
  createFile(file: FileEntity): Promise<void>;
  getNamesFromDir(dir: string): Promise<string[]>;
  readdir(dir: string): Promise<string[]>;
  copyFile(source: string, destination: string): Promise<void>;
  getFileStats(
    filePath: string
  ): Promise<{ isDirectory(): boolean; isFile(): boolean }>;
}
