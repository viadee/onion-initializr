import { expect } from 'chai';
import { FileService } from '../../../Domain/Services/FileService';
import { FileEntity } from '../../../Domain/Entities/FileEntity';
import { IFileRepository } from '../../../Domain/Interfaces/IFileRepository';

describe('FileService', () => {
  let service: FileService;
  let mockFileRepository: IFileRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let repositoryCallResults: any = {};

  beforeEach(() => {
    // Reset call tracking
    repositoryCallResults = {};

    // Create a simple mock implementation
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
          throw new Error('Source file not found');
        }
      },
      getFileStats: async (filePath: string) => {
        repositoryCallResults.getFileStats = { filePath };
        const isDir =
          filePath.includes('directory') || filePath.includes('dir');
        return {
          isDirectory: () => isDir,
          isFile: () => !isDir,
        };
      },
    };

    service = new FileService(mockFileRepository);
  });

  describe('readTemplate', () => {
    describe('when reading valid template files', () => {
      it('should return file entity with template content', async () => {
        const templatePath = 'templates/component.hbs';

        const result = await service.readTemplate(templatePath);

        expect(result).to.be.instanceOf(FileEntity);
        expect(result.filePath).to.equal(templatePath);
        expect(result.content).to.include('Template content for');
        expect(repositoryCallResults.readTemplate.templatePath).to.equal(
          templatePath
        );
      });

      it('should handle multiple template formats correctly', async () => {
        const templatePaths = [
          'templates/angular.component.ts.hbs',
          'templates/react.jsx.hbs',
          'templates/vue.vue.hbs',
        ];

        for (const templatePath of templatePaths) {
          const result = await service.readTemplate(templatePath);

          expect(result.filePath).to.equal(templatePath);
          expect(result.content).to.include(
            `Template content for ${templatePath}`
          );
        }
      });
    });

    describe('when handling template path edge cases', () => {
      it('should process various template path formats', async () => {
        const testPaths = [
          'simple-template.hbs',
          'nested/path/template.hbs',
          'template-with-dashes.hbs',
          'template.with.dots.hbs',
        ];

        for (const templatePath of testPaths) {
          const result = await service.readTemplate(templatePath);
          expect(result.filePath).to.equal(templatePath);
        }
      });
    });
  });

  describe('readFile', () => {
    describe('when reading valid files', () => {
      it('should return file entity with file content', async () => {
        const filePath = 'src/components/MyComponent.ts';

        const result = await service.readFile(filePath);

        expect(result).to.be.instanceOf(FileEntity);
        expect(result.filePath).to.equal(filePath);
        expect(result.content).to.include('Content of');
        expect(repositoryCallResults.read.path).to.equal(filePath);
      });

      it('should handle different file types correctly', async () => {
        const testFiles = [
          'package.json',
          'src/index.ts',
          'README.md',
          'config/app.config.js',
        ];

        for (const filePath of testFiles) {
          const result = await service.readFile(filePath);
          expect(result.filePath).to.equal(filePath);
          expect(result.content).to.include(`Content of ${filePath}`);
        }
      });
    });

    describe('when handling file read errors', () => {
      it('should propagate file not found errors', async () => {
        const filePath = 'non-existent-file.ts';

        try {
          await service.readFile(filePath);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect((error as Error).message).to.include('ENOENT');
        }
      });
    });
  });

  describe('fileExists', () => {
    describe('when checking file existence', () => {
      it('should return true for existing files', async () => {
        const filePath = 'src/existing-file.ts';

        const result = await service.fileExists(filePath);

        expect(result).to.be.true;
        expect(repositoryCallResults.fileExists.filePath).to.equal(filePath);
      });

      it('should return false for non-existing files', async () => {
        const filePath = 'src/non-existent-file.ts';

        const result = await service.fileExists(filePath);

        expect(result).to.be.false;
        expect(repositoryCallResults.fileExists.filePath).to.equal(filePath);
      });

      it('should handle various file path formats', async () => {
        const testPaths = [
          'simple-file.txt',
          'path/to/nested/file.js',
          'file-with-spaces.txt',
          'file.with.multiple.dots.json',
        ];

        for (const testPath of testPaths) {
          const result = await service.fileExists(testPath);
          expect(result).to.be.true;
          expect(repositoryCallResults.fileExists.filePath).to.equal(testPath);
        }
      });
    });
  });

  describe('createFile', () => {
    describe('when creating valid files', () => {
      it('should create file successfully', async () => {
        const fileEntity = new FileEntity(
          'src/NewComponent.ts',
          'export class NewComponent {}'
        );

        await service.createFile(fileEntity);

        expect(repositoryCallResults.createFile.file).to.deep.equal(fileEntity);
      });

      it('should handle files with various content types', async () => {
        const testFiles = [
          new FileEntity('package.json', '{"name": "test-package"}'),
          new FileEntity(
            'src/types.ts',
            'export interface User { id: string; }'
          ),
          new FileEntity('README.md', '# Project\n\nDescription'),
          new FileEntity('config.yml', 'development:\n  host: localhost'),
        ];

        for (const fileEntity of testFiles) {
          await service.createFile(fileEntity);
          expect(repositoryCallResults.createFile.file).to.deep.equal(
            fileEntity
          );
        }
      });
    });

    describe('when handling create file errors', () => {
      it('should propagate permission denied errors', async () => {
        const fileEntity = new FileEntity('readonly/file.ts', 'content');

        try {
          await service.createFile(fileEntity);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect((error as Error).message).to.include('permission denied');
        }
      });
    });
  });

  describe('createMultipleFiles', () => {
    describe('when creating multiple valid files', () => {
      it('should create all files in sequence', async () => {
        const files = [
          new FileEntity('src/Component1.ts', 'export class Component1 {}'),
          new FileEntity('src/Component2.ts', 'export class Component2 {}'),
          new FileEntity('src/index.ts', 'export * from "./Component1";'),
        ];

        await service.createMultipleFiles(files);

        // Verify the last file created is the index file (since we track the last call)
        expect(repositoryCallResults.createFile.file.filePath).to.equal(
          'src/index.ts'
        );
      });

      it('should handle empty file array', async () => {
        const files: FileEntity[] = [];

        await service.createMultipleFiles(files);

        // No files should be created
        expect(repositoryCallResults.createFile).to.be.undefined;
      });

      it('should create files with different extensions', async () => {
        const files = [
          new FileEntity('src/Component.tsx', 'React component'),
          new FileEntity('src/styles.scss', 'CSS styles'),
          new FileEntity('src/utils.js', 'Utility functions'),
        ];

        await service.createMultipleFiles(files);

        expect(repositoryCallResults.createFile.file.filePath).to.equal(
          'src/utils.js'
        );
      });
    });
  });

  describe('createDirectory', () => {
    describe('when creating valid directories', () => {
      it('should create directory successfully', async () => {
        const dirPath = 'src/components';

        await service.createDirectory(dirPath);

        expect(repositoryCallResults.createDirectory.dirPath).to.equal(dirPath);
      });

      it('should handle nested directory paths', async () => {
        const nestedPaths = [
          'src',
          'src/components',
          'src/components/ui',
          'src/components/ui/buttons',
        ];

        for (const dirPath of nestedPaths) {
          await service.createDirectory(dirPath);
          expect(repositoryCallResults.createDirectory.dirPath).to.equal(
            dirPath
          );
        }
      });
    });

    describe('when handling directory creation errors', () => {
      it('should propagate permission denied errors', async () => {
        const dirPath = 'protected-directory';

        try {
          await service.createDirectory(dirPath);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect((error as Error).message).to.include('permission denied');
        }
      });
    });
  });

  describe('dirExists', () => {
    describe('when checking directory existence', () => {
      it('should return true for existing directories', async () => {
        const dirPath = 'src/components';

        const result = await service.dirExists(dirPath);

        expect(result).to.be.true;
        expect(repositoryCallResults.dirExists.dirPath).to.equal(dirPath);
      });

      it('should return false for non-existing directories', async () => {
        const dirPath = 'non-existent-dir';

        const result = await service.dirExists(dirPath);

        expect(result).to.be.false;
        expect(repositoryCallResults.dirExists.dirPath).to.equal(dirPath);
      });

      it('should handle various directory path formats', async () => {
        const testPaths = [
          'simple-dir',
          'nested/path/directory',
          'dir-with-dashes',
          'dir.with.dots',
        ];

        for (const dirPath of testPaths) {
          const result = await service.dirExists(dirPath);
          expect(result).to.be.true;
          expect(repositoryCallResults.dirExists.dirPath).to.equal(dirPath);
        }
      });
    });
  });

  describe('readdir', () => {
    describe('when reading directory contents', () => {
      it('should return list of files and directories', async () => {
        const dirPath = 'src/components';

        const result = await service.readdir(dirPath);

        expect(result).to.be.an('array');
        expect(result).to.include.members([
          'file1.ts',
          'file2.js',
          'subdirectory',
        ]);
        expect(repositoryCallResults.readdir.dir).to.equal(dirPath);
      });

      it('should handle different directory paths', async () => {
        const testDirs = [
          'src/components',
          'src/services',
          'src/utils',
          'public/assets',
        ];

        for (const dirPath of testDirs) {
          const result = await service.readdir(dirPath);
          expect(result).to.be.an('array');
          expect(repositoryCallResults.readdir.dir).to.equal(dirPath);
        }
      });
    });

    describe('when handling readdir errors', () => {
      it('should propagate directory not found errors', async () => {
        const dirPath = 'non-existent-directory';

        try {
          await service.readdir(dirPath);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect((error as Error).message).to.include('ENOENT');
        }
      });
    });
  });

  describe('getNamesFromDir', () => {
    describe('when getting names from directory', () => {
      it('should return list of entity names', async () => {
        const dirPath = 'src/entities';

        const result = await service.getNamesFromDir(dirPath);

        expect(result).to.be.an('array');
        expect(result).to.include.members(['Entity1', 'Entity2', 'Entity3']);
        expect(repositoryCallResults.getNamesFromDir.dir).to.equal(dirPath);
      });

      it('should handle different directory types', async () => {
        const testDirs = [
          'src/entities',
          'src/services',
          'src/repositories',
          'src/interfaces',
        ];

        for (const dirPath of testDirs) {
          const result = await service.getNamesFromDir(dirPath);
          expect(result).to.be.an('array');
          expect(result.length).to.be.greaterThan(0);
        }
      });
    });
  });

  describe('rmSync', () => {
    describe('when removing directories', () => {
      it('should remove directory successfully', () => {
        const appDir = 'temp-directory';

        service.rmSync(appDir);

        expect(repositoryCallResults.rmSync.appDir).to.equal(appDir);
      });

      it('should handle different directory paths', () => {
        const testDirs = [
          'temp-dir',
          'build/output',
          'dist/generated',
          'node_modules/.cache',
        ];

        for (const appDir of testDirs) {
          service.rmSync(appDir);
          expect(repositoryCallResults.rmSync.appDir).to.equal(appDir);
        }
      });
    });
  });

  describe('rename', () => {
    describe('when renaming files and directories', () => {
      it('should rename successfully', () => {
        const from = 'old-name.ts';
        const to = 'new-name.ts';

        service.rename(from, to);

        expect(repositoryCallResults.rename.from).to.equal(from);
        expect(repositoryCallResults.rename.to).to.equal(to);
      });

      it('should handle various rename scenarios', () => {
        const testCases = [
          { from: 'Component.ts', to: 'MyComponent.ts' },
          { from: 'old-dir', to: 'new-dir' },
          { from: 'file.old.ext', to: 'file.new.ext' },
          { from: 'temp/file.js', to: 'src/file.js' },
        ];

        for (const testCase of testCases) {
          service.rename(testCase.from, testCase.to);
          expect(repositoryCallResults.rename.from).to.equal(testCase.from);
          expect(repositoryCallResults.rename.to).to.equal(testCase.to);
        }
      });
    });
  });

  describe('copyFile', () => {
    describe('when copying files', () => {
      it('should copy file successfully', async () => {
        const source = 'source-file.ts';
        const destination = 'destination-file.ts';

        await service.copyFile(source, destination);

        expect(repositoryCallResults.copyFile.source).to.equal(source);
        expect(repositoryCallResults.copyFile.destination).to.equal(
          destination
        );
      });

      it('should handle different copy scenarios', async () => {
        const testCases = [
          { source: 'template.ts', destination: 'generated.ts' },
          { source: 'config/base.json', destination: 'config/dev.json' },
          { source: 'assets/logo.png', destination: 'dist/logo.png' },
        ];

        for (const testCase of testCases) {
          await service.copyFile(testCase.source, testCase.destination);
          expect(repositoryCallResults.copyFile.source).to.equal(
            testCase.source
          );
          expect(repositoryCallResults.copyFile.destination).to.equal(
            testCase.destination
          );
        }
      });
    });

    describe('when handling copy errors', () => {
      it('should propagate source file not found errors', async () => {
        const source = 'non-existent-file.ts';
        const destination = 'destination.ts';

        try {
          await service.copyFile(source, destination);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect((error as Error).message).to.include('Source file not found');
        }
      });
    });
  });

  describe('getFileStats', () => {
    describe('when getting file statistics', () => {
      it('should return correct stats for files', async () => {
        const filePath = 'test-file.ts';

        const result = await service.getFileStats(filePath);

        expect(result.isFile()).to.be.true;
        expect(result.isDirectory()).to.be.false;
        expect(repositoryCallResults.getFileStats.filePath).to.equal(filePath);
      });

      it('should return correct stats for directories', async () => {
        const dirPath = 'src/components/directory';

        const result = await service.getFileStats(dirPath);

        expect(result.isDirectory()).to.be.true;
        expect(result.isFile()).to.be.false;
        expect(repositoryCallResults.getFileStats.filePath).to.equal(dirPath);
      });

      it('should distinguish between files and directories', async () => {
        const testCases = [
          { path: 'file.ts', expectedFile: true, expectedDir: false },
          { path: 'directory', expectedFile: false, expectedDir: true },
          { path: 'src/dir/subdir', expectedFile: false, expectedDir: true },
          { path: 'src/component.tsx', expectedFile: true, expectedDir: false },
        ];

        for (const testCase of testCases) {
          const result = await service.getFileStats(testCase.path);
          expect(result.isFile()).to.equal(testCase.expectedFile);
          expect(result.isDirectory()).to.equal(testCase.expectedDir);
        }
      });
    });
  });

  describe('getBrowserFiles', () => {
    describe('when getting browser files', () => {
      it('should return list of browser files', () => {
        const result = service.getBrowserFiles();

        expect(result).to.be.an('array');
        expect(result).to.include.members(['file1.ts', 'file2.js']);
        expect(repositoryCallResults.getBrowserFiles).to.be.true;
      });

      it('should return consistent results', () => {
        const result1 = service.getBrowserFiles();
        const result2 = service.getBrowserFiles();

        expect(result1).to.deep.equal(result2);
      });
    });
  });

  describe('clearBrowserFiles', () => {
    describe('when clearing browser files', () => {
      it('should clear browser storage successfully', () => {
        service.clearBrowserFiles();

        expect(repositoryCallResults.clearBrowserFiles).to.be.true;
      });

      it('should be callable multiple times', () => {
        service.clearBrowserFiles();
        service.clearBrowserFiles();

        expect(repositoryCallResults.clearBrowserFiles).to.be.true;
      });
    });
  });

  describe('integration scenarios', () => {
    describe('when performing file operation workflows', () => {
      it('should handle project setup workflow', async () => {
        const projectDir = 'new-project';
        const sourceFiles = [
          new FileEntity('src/index.ts', 'export * from "./components";'),
          new FileEntity('src/components/Button.ts', 'export class Button {}'),
        ];

        // Create directories
        await service.createDirectory(projectDir);
        await service.createDirectory(`${projectDir}/src`);
        await service.createDirectory(`${projectDir}/src/components`);

        // Create files
        for (const file of sourceFiles) {
          await service.createFile(file);
        }

        // Verify directories were created
        expect(repositoryCallResults.createDirectory.dirPath).to.equal(
          `${projectDir}/src/components`
        );

        // Verify last file was created
        expect(repositoryCallResults.createFile.file.filePath).to.equal(
          'src/components/Button.ts'
        );
      });

      it('should handle file existence checking workflow', async () => {
        const filePaths = [
          'src/index.ts',
          'src/components/Button.ts',
          'package.json',
        ];

        for (const filePath of filePaths) {
          const exists = await service.fileExists(filePath);
          expect(exists).to.be.true;
        }

        // Check non-existent file
        const nonExistentExists = await service.fileExists(
          'non-existent-file.ts'
        );
        expect(nonExistentExists).to.be.false;
      });

      it('should handle file reading and stats workflow', async () => {
        const testPath = 'src/component.ts';

        // Check if file exists
        const exists = await service.fileExists(testPath);
        expect(exists).to.be.true;

        // Get file stats
        const stats = await service.getFileStats(testPath);
        expect(stats.isFile()).to.be.true;

        // Read file content
        const fileContent = await service.readFile(testPath);
        expect(fileContent.filePath).to.equal(testPath);
        expect(fileContent.content).to.include('Content of');
      });

      it('should handle directory operations workflow', async () => {
        const dirPath = 'src/new-feature';

        // Create directory
        await service.createDirectory(dirPath);

        // Check if directory exists
        const exists = await service.dirExists(dirPath);
        expect(exists).to.be.true;

        // Read directory contents
        const contents = await service.readdir('src');
        expect(contents).to.be.an('array');

        // Get names from directory
        const names = await service.getNamesFromDir(dirPath);
        expect(names).to.be.an('array');
      });
    });
  });
});
