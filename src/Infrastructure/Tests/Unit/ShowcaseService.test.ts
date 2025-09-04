import { expect } from 'chai';
import { ShowcaseService } from '../../../Domain/Services/ShowcaseService';
import { ShowcaseAppGeneration } from '../../../Domain/Entities/ShowcaseAppGeneration';
import { FileService } from '../../../Domain/Services/FileService';
import { FileEntity } from '../../../Domain/Entities/FileEntity';
import { IFileRepository } from '../../../Domain/Interfaces/IFileRepository';

describe('ShowcaseService', () => {
  let service: ShowcaseService;
  let mockFileService: FileService;
  let mockFileRepository: IFileRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let repositoryCallResults: any = {};

  beforeEach(() => {
    repositoryCallResults = {};

    mockFileRepository = {
      readTemplate: async (templatePath: string) => {
        repositoryCallResults.readTemplate = { templatePath };
        return new FileEntity(
          templatePath,
          `Template content for ${templatePath}`
        );
      },
      clearBrowserFiles: () => {
        repositoryCallResults.clearBrowserFiles = true;
      },
      getBrowserFiles: () => {
        repositoryCallResults.getBrowserFiles = true;
        return ['file1.ts', 'file2.js'];
      },
      rmSync: (appDir: string) => {
        repositoryCallResults.rmSync = { appDir };
        return Promise.resolve();
      },
      rename: (from: string, to: string) => {
        repositoryCallResults.rename = { from, to };
        return Promise.resolve();
      },
      dirExists: async (dirPath: string) => {
        repositoryCallResults.dirExists = { dirPath };
        return !dirPath.includes('non-existent');
      },
      read: async (path: string) => {
        repositoryCallResults.read = { path };
        if (path.includes('non-existent')) {
          throw new Error('ENOENT: no such file or directory');
        }
        return new FileEntity(path, `Content of ${path}`);
      },
      fileExists: async (filePath: string) => {
        repositoryCallResults.fileExists = { filePath };
        return !filePath.includes('non-existent');
      },
      createDirectory: async (dirPath: string) => {
        repositoryCallResults.createDirectory = { dirPath };
        if (dirPath.includes('protected')) {
          throw new Error('EACCES: permission denied');
        }
      },
      createFile: async (file: FileEntity) => {
        repositoryCallResults.createFile = { file };
        if (file.filePath.includes('readonly')) {
          throw new Error('EACCES: permission denied');
        }
      },
      getNamesFromDir: async (dir: string) => {
        repositoryCallResults.getNamesFromDir = { dir };
        return ['Entity1', 'Entity2', 'Entity3'];
      },
      readdir: async (dir: string) => {
        repositoryCallResults.readdir = { dir };
        if (dir.includes('non-existent')) {
          throw new Error('ENOENT: no such file or directory');
        }
        return ['file1.ts', 'file2.js', 'subdirectory'];
      },
      copyFile: async (source: string, destination: string) => {
        repositoryCallResults.copyFile = { source, destination };
        if (source.includes('non-existent')) {
          throw new Error('ENOENT: no such file or directory');
        }
      },
      getFileStats: async (filePath: string) => {
        repositoryCallResults.getFileStats = { filePath };
        return {
          isDirectory: () => filePath.includes('directory'),
          isFile: () => !filePath.includes('directory'),
        };
      },
    };

    mockFileService = new FileService(mockFileRepository);
    service = new ShowcaseService(mockFileService);
  });

  describe('constructor', () => {
    it('should create an instance of ShowcaseService', () => {
      expect(service).to.be.instanceOf(ShowcaseService);
    });

    it('should accept a FileService dependency', () => {
      const newService = new ShowcaseService(mockFileService);
      expect(newService).to.be.instanceOf(ShowcaseService);
    });
  });

  describe('generateShowcaseFiles', () => {
    it('should return empty array for vanilla framework', async () => {
      const request = new ShowcaseAppGeneration(
        '/test/path',
        'vanilla',
        false,
        'TestAppService'
      );

      const pathBuilder = (template: string, output: string) => ({
        templatePath: `/templates/${template}`,
        outputPath: `/output/${output}`,
      });

      const result = await service.generateShowcaseFiles(request, pathBuilder);

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should generate files for React framework', async () => {
      const request = new ShowcaseAppGeneration(
        '/test/path',
        'react',
        false,
        'TestAppService'
      );

      const pathBuilder = (template: string, output: string) => ({
        templatePath: `/templates/${template}`,
        outputPath: `/output/${output}`,
      });

      const result = await service.generateShowcaseFiles(request, pathBuilder);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      expect(result[0]).to.be.instanceOf(FileEntity);
    });

    it('should handle request without firstAppService', async () => {
      const request = new ShowcaseAppGeneration('/test/path', 'react', false);

      const pathBuilder = (template: string, output: string) => ({
        templatePath: `/templates/${template}`,
        outputPath: `/output/${output}`,
      });

      const result = await service.generateShowcaseFiles(request, pathBuilder);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
    });

    it('should call readTemplate through FileService', async () => {
      const request = new ShowcaseAppGeneration(
        '/test/path',
        'react',
        false,
        'TestAppService'
      );

      const pathBuilder = (template: string, output: string) => ({
        templatePath: `/templates/${template}`,
        outputPath: `/output/${output}`,
      });

      await service.generateShowcaseFiles(request, pathBuilder);

      expect(repositoryCallResults.readTemplate).to.exist;
      expect(repositoryCallResults.readTemplate.templatePath).to.be.a('string');
    });

    it('should return FileEntity objects with correct structure', async () => {
      const request = new ShowcaseAppGeneration(
        '/test/path',
        'vue',
        false,
        'TestAppService'
      );

      const pathBuilder = (template: string, output: string) => ({
        templatePath: `/templates/${template}`,
        outputPath: `/output/${output}`,
      });

      const result = await service.generateShowcaseFiles(request, pathBuilder);

      expect(result).to.be.an('array');

      if (result.length > 0) {
        const firstFile = result[0];
        expect(firstFile).to.be.instanceOf(FileEntity);
        expect(firstFile.filePath).to.be.a('string');
        expect(firstFile.content).to.be.a('string');
        expect(firstFile.filePath).to.contain('/output/');
      }
    });
  });
});
