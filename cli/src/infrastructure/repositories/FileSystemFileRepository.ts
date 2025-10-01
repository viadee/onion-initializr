import { PathAppService } from "../../../../lib/Application/Services/PathAppService";
import { FileEntity } from "../../../../lib/Domain/Entities/FileEntity";
import { IFileRepository } from "../../../../lib/Domain/Interfaces/IFileRepository";

// Only import fs and path for Node.js usage
let fs: typeof import("fs") | undefined;
let path: typeof import("path") | undefined;

export class FileSystemFileRepository implements IFileRepository {
  constructor(private readonly pathService: PathAppService) {}

  clearBrowserFiles(): void {
    throw new Error("Method not implemented.");
  }
  getBrowserFiles(): string[] {
    throw new Error("Method not implemented.");
  }

  async rmSync(appDir: string): Promise<void> {
    if (!fs || !path) {
      fs = await import("fs");
      path = await import("path");
    }
    fs.rmSync(appDir, { recursive: true, force: true });
  }

  async readTemplate(templateName: string): Promise<FileEntity> {
    let filePath: string;

    if (!templateName.includes("/") && !templateName.includes("\\")) {
      // Simple filename - assume it's in Domain/Services/templates
      filePath = this.pathService.join(
        __dirname,
        "..",
        "..",
        "Domain",
        "Services",
        "templates",
        templateName,
      );
    } else {
      // Full path provided - construct from project root
      const rootDir = this.pathService.resolve(__dirname, "../../../");
      filePath = this.pathService.join(
        rootDir,
        "public",
        "templates",
        templateName,
      );
    }

    return await this.read(filePath);
  }
  async read(filePath: string): Promise<FileEntity> {
    fs ??= await import("fs");

    if (!this.pathService.isAbsolute(filePath)) {
      const rootDir = this.pathService.resolve(__dirname, "../../../");
      filePath = this.pathService.join(rootDir, filePath);
    }

    return {
      filePath: filePath,
      content: await fs.promises.readFile(filePath, "utf-8"),
    };
  }

  async fileExists(filePath: string): Promise<boolean> {
    fs ??= await import("fs");
    return fs.existsSync(filePath);
  }

  async createDirectory(dirPath: string): Promise<void> {
    fs ??= await import("fs");

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async createFile(file: FileEntity): Promise<void> {
    fs ??= await import("fs");
    fs.writeFileSync(file.filePath, file.content, { encoding: "utf8" });
  }

  async dirExists(dirPath: string): Promise<boolean> {
    fs ??= await import("fs");
    return fs.existsSync(dirPath);
  }

  async rename(from: string, to: string): Promise<void> {
    fs ??= await import("fs");
    fs.renameSync(from, to);
  }

  async reSync(appDir: string): Promise<void> {
    fs ??= await import("fs");
    fs.rmSync(appDir, { recursive: true, force: true });
  }

  async getNamesFromDir(dir: string): Promise<string[]> {
    fs ??= await import("fs");
    path ??= await import("path");

    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => path!.basename(f, ".ts"));
  }

  async readdir(dir: string): Promise<string[]> {
    fs ??= await import("fs");
    return fs.readdirSync(dir);
  }

  async copyFile(source: string, destination: string): Promise<void> {
    fs ??= await import("fs");
    fs.copyFileSync(source, destination);
  }

  async getFileStats(
    filePath: string,
  ): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
    fs ??= await import("fs");
    const stats = fs.statSync(filePath);
    return {
      isDirectory: () => stats.isDirectory(),
      isFile: () => stats.isFile(),
    };
  }
}
