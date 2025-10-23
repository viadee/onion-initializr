import { PathAppService } from '../../../../lib/application/services/path-app-service';
import { FileEntity } from '../../../../lib/domain/entities/file-entity';
import { IFileRepository } from '../../../../lib/domain/interfaces/ifile-repository';
import fs from 'node:fs';
import path from 'node:path';

export class FileSystemFileRepository implements IFileRepository {
  constructor(private readonly pathService: PathAppService) {}

  clearBrowserFiles(): void {
    throw new Error('Method not implemented.');
  }
  getBrowserFiles(): string[] {
    throw new Error('Method not implemented.');
  }

  async rmSync(appDir: string): Promise<void> {
    fs.rmSync(appDir, { recursive: true, force: true });
  }

  async readTemplate(templateName: string): Promise<FileEntity> {
    let filePath: string;

    if (!templateName.includes('/') && !templateName.includes('\\')) {
      // Simple filename - assume it's in Domain/services/templates
      filePath = this.pathService.join(
        __dirname,
        '..',
        '..',
        'domain',
        'services',
        'templates',
        templateName
      );
    } else {
      // Full path provided - construct from project root
      const rootDir = this.pathService.resolve(__dirname, '../../../');
      filePath = this.pathService.join(
        rootDir,
        'public',
        'templates',
        templateName
      );
    }

    return await this.read(filePath);
  }
  async read(filePath: string): Promise<FileEntity> {
    if (!this.pathService.isAbsolute(filePath)) {
      const rootDir = this.pathService.resolve(__dirname, '../../../');
      filePath = this.pathService.join(rootDir, filePath);
    }

    return {
      filePath: filePath,
      content: await fs.promises.readFile(filePath, 'utf-8'),
    };
  }

  async fileExists(filePath: string): Promise<boolean> {
    return fs.existsSync(filePath);
  }

  async createDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async createFile(file: FileEntity): Promise<void> {
    fs.writeFileSync(file.filePath, file.content, { encoding: 'utf8' });
  }

  async dirExists(dirPath: string): Promise<boolean> {
    return fs.existsSync(dirPath);
  }

  async rename(from: string, to: string): Promise<void> {
    fs.renameSync(from, to);
  }

  async reSync(appDir: string): Promise<void> {
    fs.rmSync(appDir, { recursive: true, force: true });
  }

  async getNamesFromDir(dir: string): Promise<string[]> {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.ts'))
      .map(f => path!.basename(f, '.ts'));
  }

  async readdir(dir: string): Promise<string[]> {
    return fs.readdirSync(dir);
  }

  async copyFile(source: string, destination: string): Promise<void> {
    fs.copyFileSync(source, destination);
  }

  async getFileStats(
    filePath: string
  ): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
    const stats = fs.statSync(filePath);
    return {
      isDirectory: () => stats.isDirectory(),
      isFile: () => stats.isFile(),
    };
  }
}
