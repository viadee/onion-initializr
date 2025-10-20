import { IWebContainerRepository } from '../Interfaces/iweb-container-repository';
import { WebContainer } from '@webcontainer/api';
import { FileEntity } from '../../../../lib/Domain/Entities/file-entity';
import { IFileRepository } from '../../../../lib/Domain/Interfaces/ifile-repository';
export class WebContainerFileRepository
  implements IFileRepository, IWebContainerRepository
{
  private webcontainer: WebContainer | null = null;
  private browserFiles: string[] = [];

  async readTemplate(templateName: string): Promise<FileEntity> {
    let fetchUrl: string;
    if (templateName.startsWith('infrastructure')) {
      fetchUrl = `/templates/${templateName}`;
    } else {
      fetchUrl = `/templates/domain/services/templates/${templateName}`;
    }

    const normalizedPath = fetchUrl.replace(/\\/g, '/');
    fetchUrl = normalizedPath;

    const response = await fetch(fetchUrl);
    if (response.ok) {
      return {
        filePath: 'todo fix',
        content: await response.text(),
      };
    } else {
      console.warn(
        `Failed to fetch template ${fetchUrl}: ${response.status} ${response.statusText}`
      );
      throw new Error(`Could not read template file ${templateName}`);
    }
  }

  /**
   * Set the WebContainer instance (should be called after WebContainer.boot())
   */
  setWebContainer(webcontainer: WebContainer): void {
    this.webcontainer = webcontainer;
  }

  /**
   * Initialize with existing WebContainer instance
   */
  async initializeWebContainer(
    webcontainer?: WebContainer
  ): Promise<WebContainer> {
    if (webcontainer) {
      this.webcontainer = webcontainer;
    }

    if (!this.webcontainer) {
      throw new Error(
        'WebContainer instance must be provided. Use setWebContainer() first.'
      );
    }

    return this.webcontainer;
  }

  async getWebContainer(): Promise<WebContainer> {
    if (!this.webcontainer) {
      throw new Error(
        'WebContainer not initialized. Call initializeWebContainer() first.'
      );
    }
    return this.webcontainer;
  }

  clearBrowserFiles(): void {
    this.browserFiles = [];
  }

  /**
   * Reset the WebContainer filesystem by removing all files and directories
   */
  async resetWebContainer(): Promise<void> {
    if (!this.webcontainer) {
      console.warn('WebContainer not initialized, nothing to reset');
      return;
    }

    try {
      // Clear browser files cache
      this.clearBrowserFiles();

      // Get all items in root directory
      const rootItems = await this.webcontainer.fs.readdir('/');

      // Remove all items except system directories
      const systemDirs = ['tmp', 'dev', 'proc', 'sys']; // Common system directories to preserve

      for (const item of rootItems) {
        if (!systemDirs.includes(item)) {
          try {
            await this.webcontainer.fs.rm(`/${item}`, {
              recursive: true,
              force: true,
            });
            console.log(`Removed: /${item}`);
          } catch (error) {
            console.warn(`Could not remove /${item}:`, error);
          }
        }
      }

      console.log('WebContainer filesystem reset completed');
    } catch (error) {
      console.error('Error resetting WebContainer:', error);
    }
  }

  getBrowserFiles(): string[] {
    return [...this.browserFiles];
  }

  async rmSync(appDir: string): Promise<void> {
    const webcontainer = await this.getWebContainer();
    try {
      await webcontainer.fs.rm(appDir, { recursive: true, force: true });
      // Remove from browser files tracking
      this.browserFiles = this.browserFiles.filter(
        file => !file.startsWith(appDir)
      );
    } catch (error) {
      // Ignore errors if directory doesn't exist
      console.warn(`Could not remove directory ${appDir}:`, error);
    }
  }

  async read(filePath: string): Promise<FileEntity> {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const webcontainer = await this.getWebContainer();
    const content = await webcontainer.fs.readFile(normalizedPath, 'utf-8');
    return { filePath: normalizedPath, content };
  }

  async fileExists(filePath: string): Promise<boolean> {
    const webcontainer = await this.getWebContainer();
    const normalizedPath = filePath.replace(/\\/g, '/');

    try {
      await webcontainer.fs.readFile(normalizedPath);
      return true;
    } catch {
      // Check if it's a directory instead of a file
      try {
        await webcontainer.fs.readdir(normalizedPath);
        return false; // It's a directory, not a file
      } catch {
        return false; // Neither file nor directory exists
      }
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    const webcontainer = await this.getWebContainer();
    const normalizedPath = dirPath.replace(/\\/g, '/');

    try {
      // Check if directory already exists
      if (await this.dirExists(normalizedPath)) {
        return; // Directory already exists, nothing to do
      }

      // Check if there's already a file with the same name
      const isFileExisting = await this.fileExists(normalizedPath);
      if (isFileExisting) {
        console.warn(
          `File exists with same name as directory: ${normalizedPath}, removing file first`
        );
        await webcontainer.fs.rm(normalizedPath, { force: true });
      }

      await webcontainer.fs.mkdir(normalizedPath, { recursive: true });
    } catch (error) {
      const errorMessage = (error as Error).message;
      // Handle specific error cases
      if (errorMessage.includes('EEXIST') || errorMessage.includes('exists')) {
        // Directory already exists, which is fine
        return;
      }
      if (
        errorMessage.includes('EISDIR') ||
        errorMessage.includes('is a directory')
      ) {
        // Path is already a directory, which is what we want
        return;
      }

      console.warn(`Could not create directory ${normalizedPath}:`, error);
      // Don't throw - just log warning and continue
    }
  }

  async createFile(file: FileEntity): Promise<void> {
    const webcontainer = await this.getWebContainer();
    const normalizedPath = file.filePath.replace(/\\/g, '/');

    // Ensure directory exists
    const dirPath = normalizedPath.substring(
      0,
      normalizedPath.lastIndexOf('/')
    );
    if (dirPath) {
      await this.createDirectory(dirPath);
    }

    try {
      // Check if there's already a directory with the same name
      const isDirExisting = await this.dirExists(normalizedPath);
      if (isDirExisting) {
        console.warn(
          `Directory exists with same name as file: ${normalizedPath}, removing directory first`
        );
        await webcontainer.fs.rm(normalizedPath, {
          recursive: true,
          force: true,
        });
      }

      await webcontainer.fs.writeFile(normalizedPath, file.content, 'utf-8');

      // Track created files
      if (!this.browserFiles.includes(normalizedPath)) {
        this.browserFiles.push(normalizedPath);
      }
    } catch (error) {
      throw new Error(`Could not create file ${file.filePath}: ${error}`);
    }
  }

  async dirExists(dirPath: string): Promise<boolean> {
    const webcontainer = await this.getWebContainer();
    const normalizedPath = dirPath.replace(/\\/g, '/');

    try {
      await webcontainer.fs.readdir(normalizedPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a path exists (file or directory)
   */
  async pathExists(path: string): Promise<boolean> {
    return (await this.fileExists(path)) || (await this.dirExists(path));
  }

  async rename(from: string, to: string): Promise<void> {
    const webcontainer = await this.getWebContainer();
    const normalizedFrom = from.replace(/\\/g, '/');
    const normalizedTo = to.replace(/\\/g, '/');

    // Ensure destination directory exists
    const toDir = normalizedTo.substring(0, normalizedTo.lastIndexOf('/'));
    if (toDir) {
      await this.createDirectory(toDir);
    }

    try {
      await webcontainer.fs.rename(normalizedFrom, normalizedTo);

      // Update browser files tracking
      const fromIndex = this.browserFiles.indexOf(normalizedFrom);
      if (fromIndex !== -1) {
        this.browserFiles[fromIndex] = normalizedTo;
      }
    } catch (error) {
      throw new Error(`Could not rename ${from} to ${to}: ${error}`);
    }
  }

  async reSync(appDir: string): Promise<void> {
    // Same as rmSync for WebContainer
    await this.rmSync(appDir);
  }

  async getNamesFromDir(dir: string): Promise<string[]> {
    const webcontainer = await this.getWebContainer();
    const normalizedPath = dir.replace(/\\/g, '/');

    try {
      const files = await webcontainer.fs.readdir(normalizedPath);
      return files
        .filter((file: string) => file.endsWith('.ts'))
        .map((file: string) => file.replace('.ts', ''));
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error);
      return [];
    }
  }

  async readdir(dir: string): Promise<string[]> {
    const webcontainer = await this.getWebContainer();
    const normalizedPath = dir.replace(/\\/g, '/');

    try {
      const files = await webcontainer.fs.readdir(normalizedPath);
      return Array.isArray(files) ? files : [];
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error);
      return [];
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    const webcontainer = await this.getWebContainer();
    const normalizedSource = source.replace(/\\/g, '/');
    const normalizedDestination = destination.replace(/\\/g, '/');

    try {
      const content = await webcontainer.fs.readFile(normalizedSource, 'utf-8');
      await webcontainer.fs.writeFile(normalizedDestination, content);
    } catch (error) {
      console.warn(
        `Could not copy file from ${source} to ${destination}:`,
        error
      );
      throw error;
    }
  }

  async getFileStats(
    filePath: string
  ): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
    const webcontainer = await this.getWebContainer();
    const normalizedPath = filePath.replace(/\\/g, '/');

    try {
      // Try to read as directory first
      await webcontainer.fs.readdir(normalizedPath);
      return {
        isDirectory: () => true,
        isFile: () => false,
      };
    } catch {
      try {
        // If directory read fails, try to read as file
        await webcontainer.fs.readFile(normalizedPath);
        return {
          isDirectory: () => false,
          isFile: () => true,
        };
      } catch {
        console.warn(`Could not determine file stats for ${filePath}`);
        return {
          isDirectory: () => false,
          isFile: () => false,
        };
      }
    }
  }

  /**
   * Install npm packages in the WebContainer
   */
  async installPackages(packages: string[], cwd: string = '/'): Promise<void> {
    const webcontainer = await this.getWebContainer();
    const normalizedCwd = cwd.replace(/\\/g, '/');

    try {
      const installProcess = await webcontainer.spawn(
        'npm',
        ['install', ...packages],
        {
          cwd: normalizedCwd,
        }
      );

      const exitCode = await installProcess.exit;
      if (exitCode !== 0) {
        throw new Error(
          `Package installation failed with exit code ${exitCode}`
        );
      }
    } catch (error) {
      throw new Error(`Could not install packages: ${error}`);
    }
  }

  /**
   * Get all project files with their contents for download
   */
  async getAllProjectFiles(
    projectDir: string
  ): Promise<{ path: string; content: string }[]> {
    const webcontainer = await this.getWebContainer();
    const normalizedProjectDir = projectDir.replace(/\\/g, '/');
    const allFiles: { path: string; content: string }[] = [];

    async function readDirectory(dir: string): Promise<void> {
      try {
        const items = await webcontainer.fs.readdir(dir, {
          withFileTypes: true,
        });

        for (const item of items) {
          const itemPath = `${dir}/${item.name}`;

          if (item.isDirectory()) {
            // Skip node_modules and other unnecessary directories
            if (
              item.name !== 'node_modules' &&
              item.name !== '.git' &&
              !item.name.startsWith('.')
            ) {
              await readDirectory(itemPath);
            }
          } else {
            // Read file content
            try {
              const content = await webcontainer.fs.readFile(itemPath, 'utf-8');
              // Remove the project directory prefix for the zip structure
              const relativePath = itemPath.replace(
                normalizedProjectDir + '/',
                ''
              );
              allFiles.push({ path: relativePath, content });
            } catch (readError) {
              console.warn(`Could not read file ${itemPath}:`, readError);
            }
          }
        }
      } catch (error) {
        console.warn(`Could not read directory ${dir}:`, error);
      }
    }

    await readDirectory(normalizedProjectDir);
    return allFiles;
  }
}
