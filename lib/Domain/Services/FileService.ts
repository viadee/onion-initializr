import { FileEntity } from "../Entities/FileEntity";
import { IFileRepository } from "../Interfaces/IFileRepository";

/**
 * Service for basic file and directory operations.
 * Handles file system operations without technical concerns like compression.
 */
export class FileService {
  constructor(private readonly fileRepository: IFileRepository) {}
  readTemplate(templatePath: string): Promise<FileEntity> {
    return this.fileRepository.readTemplate(templatePath);
  }

  readdir(dir: string): Promise<string[]> {
    return this.fileRepository.readdir(dir);
  }

  async rmSync(appDir: string) {
    this.fileRepository.rmSync(appDir);
  }

  async getNamesFromDir(dir: string): Promise<string[]> {
    return this.fileRepository.getNamesFromDir(dir);
  }

  rename(from: string, to: string) {
    this.fileRepository.rename(from, to);
  }

  async readFile(path: string): Promise<FileEntity> {
    return this.fileRepository.read(path);
  }

  async fileExists(filePath: string): Promise<boolean> {
    return this.fileRepository.fileExists(filePath);
  }

  async createDirectory(dirPath: string): Promise<void> {
    return this.fileRepository.createDirectory(dirPath);
  }

  async dirExists(dirPath: string): Promise<boolean> {
    return this.fileRepository.dirExists(dirPath);
  }

  async createFile(file: FileEntity): Promise<void> {
    return this.fileRepository.createFile(file);
  }

  // Batch operations for multiple files
  async createMultipleFiles(files: FileEntity[]): Promise<void> {
    for (const file of files) {
      await this.createFile(file);
    }
  }

  // Get list of files in browser storage
  getBrowserFiles(): string[] {
    return this.fileRepository.getBrowserFiles();
  }

  // Utility method to clear browser storage
  clearBrowserFiles(): void {
    this.fileRepository.clearBrowserFiles();
  }

  async copyFile(source: string, destination: string): Promise<void> {
    return this.fileRepository.copyFile(source, destination);
  }

  async getFileStats(
    filePath: string
  ): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
    return this.fileRepository.getFileStats(filePath);
  }
}
