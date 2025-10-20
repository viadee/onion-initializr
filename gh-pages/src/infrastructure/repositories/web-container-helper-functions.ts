import { FileEntity } from '../../../../lib/domain/entities/file-entity';
import { IFileRepository } from '../../../../lib/domain/interfaces/ifile-repository';

/**
 * WebContainer-compatible helper functions that mirror the Node.js fs operations
 * These functions work with the WebContainer filesystem instead of Node.js fs
 */
export class WebContainerHelperFunctions {
  constructor(private readonly fileRepository: IFileRepository) {}

  async copyFolderRecursiveSync(source: string, target: string): Promise<void> {
    // Ensure target directory exists
    await this.fileRepository.createDirectory(target);

    try {
      const items = await this.fileRepository.readdir(source);

      for (const item of items) {
        const srcPath = `${source}/${item}`.replace(/\/+/g, '/');
        const destPath = `${target}/${item}`.replace(/\/+/g, '/');

        // Use dirExists to properly check if it's a directory
        const isDirectory = await this.fileRepository.dirExists(srcPath);

        if (isDirectory) {
          // It's a directory, recurse
          await this.copyFolderRecursiveSync(srcPath, destPath);
        } else {
          // It's a file, copy it
          try {
            const file = await this.fileRepository.read(srcPath);
            await this.fileRepository.createFile({
              content: file.content,
              filePath: destPath,
            });
          } catch (error) {
            console.warn(`Could not copy file ${srcPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not copy folder ${source}:`, error);
    }
  }

  async moveFilesAndCleanUp(fromPath: string, toPath: string): Promise<void> {
    await this.copyFolderRecursiveSync(fromPath, toPath);
    await this.fileRepository.rmSync(fromPath);
  }

  escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async updateMultipleImports(
    filePath: string,
    replacements: Record<string, string>
  ): Promise<void> {
    if (!(await this.fileRepository.fileExists(filePath))) {
      return;
    }

    const file: FileEntity = await this.fileRepository.read(filePath);

    for (const [oldPath, newPath] of Object.entries(replacements)) {
      const escapedOldPath = this.escapeRegExp(oldPath);
      const importRegex = new RegExp(
        `(import\\s+[^'"]*?['"])${escapedOldPath}(['"])`,
        'g'
      );

      file.content = file.content.replace(importRegex, `$1${newPath}$2`);
    }

    await this.fileRepository.createFile({
      filePath,
      content: file.content,
    });
  }

  async createShimsVueFile(folderPath: string): Promise<void> {
    const shimsFilePath = `${folderPath}/shims-vue.d.ts`.replace(/\/+/g, '/');
    const content = `declare module "*.vue" {
        import Vue from "vue";
        export default Vue;
    }`;

    await this.fileRepository.createFile({
      filePath: shimsFilePath,
      content,
    });
  }

  // Vue requires the use of type imports for interfaces.
  // It seems, it can not be changed to not require them.
  async changeToTypeImportSyntax(folderPath: string): Promise<void> {
    try {
      const files = await this.fileRepository.readdir(folderPath);

      for (const file of files) {
        const filePath = `${folderPath}/${file}`.replace(/\/+/g, '/');

        // Use dirExists to properly check if it's a directory
        const isDirectory = await this.fileRepository.dirExists(filePath);

        if (isDirectory) {
          // It's a directory, recurse
          await this.changeToTypeImportSyntax(filePath);
        } else if (file.endsWith('.ts')) {
          // It's a TypeScript file, process it
          try {
            let file = await this.fileRepository.read(filePath);
            const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;

            const content = file.content.replace(
              importRegex,
              (match: any, imports: unknown, modulePath: string | string[]) => {
                if (modulePath.includes('Interfaces')) {
                  return `import type {${imports}} from '${modulePath}'`;
                }
                return match;
              }
            );

            await this.fileRepository.createFile({
              filePath,
              content,
            });
          } catch (error) {
            console.warn(`Could not process file ${filePath}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not process directory ${folderPath}:`, error);
    }
  }

  lowerFirst(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  async removeFile(folderPath: string, filename: string): Promise<void> {
    const filePath = `${folderPath}/${filename}`.replace(/\/+/g, '/');

    try {
      await this.fileRepository.rmSync(filePath);
      console.log(`File ${filename} removed successfully from ${folderPath}`);
    } catch (error) {
      console.warn(`Error removing file ${filename}:`, error);
    }
  }

  async removeDirectory(dirPath: string): Promise<void> {
    try {
      await this.fileRepository.rmSync(dirPath);
      console.log(`Directory ${dirPath} removed successfully`);
    } catch (error) {
      console.warn(`Error removing directory ${dirPath}:`, error);
    }
  }
}
