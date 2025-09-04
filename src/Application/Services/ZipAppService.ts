import JSZip from 'jszip';
import { FileEntity } from '../../Domain/Entities/FileEntity';
import { BrowserCheckAppService } from './BrowserCheckAppService';
import { IFileRepository } from '../../Domain/Interfaces/IFileRepository';

/**
 * Service for ZIP file operations and downloads.
 * Handles technical concerns related to file compression and browser downloads.
 */
export class ZipAppService {
  constructor(
    private readonly browserCheckAppService: BrowserCheckAppService,
    private readonly fileRepository: IFileRepository
  ) {}

  /**
   * Create and download a ZIP file from a collection of FileEntity objects
   */
  async createAndDownloadZip(
    files: FileEntity[],
    zipFileName: string = 'generated-files.zip'
  ): Promise<void> {
    this.validateBrowserEnvironment();
    this.validateFiles(files);

    const zipBlob = await this.createZipBlob(files);
    this.triggerDownload(zipBlob, zipFileName);
  }

  /**
   * Create a ZIP blob from FileEntity objects
   */
  async createZipBlob(files: FileEntity[]): Promise<Blob> {
    this.validateBrowserEnvironment();
    this.validateFiles(files);

    const zip = new JSZip();

    for (const file of files) {
      const cleanPath = this.sanitizeFilePath(file.filePath);
      zip.file(cleanPath, file.content);
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Create and download ZIP from files stored in browser repository
   */
  async createAndDownloadZipFromRepository(
    zipFileName: string = 'generated-files.zip'
  ): Promise<void> {
    this.validateBrowserEnvironment();

    const browserFiles = this.fileRepository.getBrowserFiles();
    if (browserFiles.length === 0) {
      throw new Error('No files available in repository to zip');
    }

    const zip = new JSZip();

    for (const filePath of browserFiles) {
      const file = await this.fileRepository.read(filePath);
      const cleanPath = this.sanitizeFilePath(filePath);
      zip.file(cleanPath, file.content);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this.triggerDownload(zipBlob, zipFileName);
  }

  /**
   * Create ZIP from file paths and their contents
   */
  async createZipFromPaths(
    filePaths: { path: string; content: string }[],
    zipFileName: string = 'generated-files.zip'
  ): Promise<void> {
    this.validateBrowserEnvironment();

    if (filePaths.length === 0) {
      throw new Error('No file paths provided');
    }

    const zip = new JSZip();

    for (const { path, content } of filePaths) {
      const cleanPath = this.sanitizeFilePath(path);
      zip.file(cleanPath, content);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this.triggerDownload(zipBlob, zipFileName);
  }

  /**
   * Get ZIP statistics
   */
  async getZipStats(files: FileEntity[]): Promise<{
    fileCount: number;
    totalSize: number;
    estimatedZipSize: number;
  }> {
    const totalSize = files.reduce((sum, file) => sum + file.content.length, 0);

    // Create a small sample to estimate compression ratio
    const sampleZip = new JSZip();
    const sampleFile = files[0];
    if (sampleFile) {
      sampleZip.file('sample.txt', sampleFile.content);
      const sampleBlob = await sampleZip.generateAsync({ type: 'blob' });
      const compressionRatio = sampleBlob.size / sampleFile.content.length;

      return {
        fileCount: files.length,
        totalSize,
        estimatedZipSize: Math.round(totalSize * compressionRatio),
      };
    }

    return {
      fileCount: files.length,
      totalSize,
      estimatedZipSize: totalSize,
    };
  }

  /**
   * Validate that we're in a browser environment
   */
  private validateBrowserEnvironment(): void {
    if (!this.browserCheckAppService.isBrowser()) {
      throw new Error(
        'ZIP operations are only supported in browser environment'
      );
    }
  }

  /**
   * Validate that files array is not empty
   */
  private validateFiles(files: FileEntity[]): void {
    if (files.length === 0) {
      throw new Error('No files provided for ZIP creation');
    }
  }

  /**
   * Sanitize file path for ZIP entry
   */
  private sanitizeFilePath(filePath: string): string {
    // Remove leading slashes to avoid absolute paths in ZIP
    let cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    // Replace backslashes with forward slashes for consistency
    cleanPath = cleanPath.replace(/\\/g, '/');

    return cleanPath;
  }

  /**
   * Trigger browser download of a blob
   */
  private triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Clean up the object URL to prevent memory leaks
    URL.revokeObjectURL(url);
  }
}
