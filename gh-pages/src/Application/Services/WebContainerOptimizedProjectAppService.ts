import { UiLibrary } from './../../../../lib/Domain/Entities/UiLibrary';
import { FileService } from '../../../../lib/Domain/Services/FileService';
import { WebContainerCommandRunner } from '../../Infrastructure/Repositories/WebContainerCommandRunner';
import { WebContainerFileRepository } from '../../Infrastructure/Repositories/WebContainerFileRepository';
import { WebContainerHelperFunctions } from '../../Infrastructure/Repositories/WebContainerHelperFunctions';
import { IProjectService } from '../../../../lib/Domain/Interfaces/IProjectService';
import {
  WebContainerOptimizationService,
  PackageJsonStructure,
} from './WebContainerOptimizationAppService';
import { IFileRepository } from '../../../../lib/Domain/Interfaces/IFileRepository';
import { DiFramework } from '../../../../lib/Domain/Entities/DiFramework';
import { FileEntity } from '../../../../lib/Domain/Entities/FileEntity';
import { UIFrameworks } from '../../../../lib/Domain/Entities/UiFramework';
import { UILibrarySetupService } from '../../../../lib/Application/Services/UILibrarySetupService';
/**
 * Optimized WebContainer project service that uses pre-generated lock files
 * to dramatically reduce installation time from ~50s to ~5s
 */
export class WebContainerOptimizedProjectAppService implements IProjectService {
  private commandRunner: WebContainerCommandRunner | null = null;

  constructor(
    private readonly fileService: FileService,
    private readonly fileRepository: IFileRepository,
    private readonly helperFunctions: WebContainerHelperFunctions,
    private readonly uiLibrarySetupService: UILibrarySetupService
  ) {}

  private async initializeCommandRunner(): Promise<WebContainerCommandRunner> {
    if (!this.commandRunner) {
      // Get WebContainer instance from the repository (same pattern as WebContainerProjectAppService)
      const webcontainerRepo = this
        .fileRepository as WebContainerFileRepository;
      if (webcontainerRepo.getWebContainer) {
        const webcontainer = await webcontainerRepo.getWebContainer();
        this.commandRunner = new WebContainerCommandRunner(webcontainer);
      } else {
        throw new Error('FileRepository is not a WebContainer repository');
      }
    }
    return this.commandRunner;
  }

  async isInitialized(folderPath: string): Promise<boolean> {
    const packageJsonPath = `${folderPath}/package.json`.replace(/\/+/g, '/');
    const srcDir = `${folderPath}/src`.replace(/\/+/g, '/');
    return (
      (await this.fileService.fileExists(packageJsonPath)) &&
      (await this.fileService.fileExists(srcDir))
    );
  }

  /**
   * Fast project initialization using pre-generated lock files
   */
  async initialize(
    folderPath: string,
    uiFramework: keyof UIFrameworks = 'react',
    diFramework: DiFramework = 'awilix',
    uiLibrary: UiLibrary = 'none',
    progressCallback?: (phase: string, progress: number) => void
  ): Promise<
    | {
        uiFramework: keyof UIFrameworks;
        diFramework: DiFramework;
        uiLibrary: UiLibrary;
      }
    | undefined
  > {
    try {
      const startTime = Date.now();

      // Optimized npm init (uses pre-generated package.json)
      progressCallback?.('npm-init', 0);
      await this.setupOptimizedProject(folderPath, uiFramework, diFramework);
      progressCallback?.('npm-init', 100);

      // Optimized dependency installation (uses pre-generated lock file)
      progressCallback?.('install-dev-deps', 0);
      await this.fastInstallDependencies(folderPath);
      progressCallback?.('install-dev-deps', 100);

      // For WebContainer, we'll default to a framework since we can't prompt
      uiFramework = uiFramework || 'react';
      diFramework = diFramework || 'awilix';
      uiLibrary = uiLibrary || 'none';

      const packageJsonPath = `${folderPath}/package.json`.replace(/\/+/g, '/');
      const originalPackageJson =
        await this.fileService.readFile(packageJsonPath);

      // Framework setup and file organization
      progressCallback?.('create-framework', 0);
      await this.setupUIFramework(
        folderPath,
        uiFramework,
        (progress: number) => {
          progressCallback?.('create-framework', progress);
        }
      );
      await this.fileService.createFile({
        filePath: packageJsonPath,
        content: originalPackageJson.content,
      });
      if (uiLibrary !== 'none') {
        const updatedPackageJson = await this.setUpUiLibrary(
          folderPath,
          uiLibrary
        );
        await this.fileService.createFile({
          filePath: packageJsonPath,
          content: updatedPackageJson!.content,
        });
      }

      progressCallback?.('create-framework', 100);

      progressCallback?.('move-files', 0);
      // File moving is handled within setupUIFramework
      progressCallback?.('move-files', 100);
      // Final project setup (ESLint, Prettier, etc.)
      await this.createEslintConfig(folderPath);
      await this.addLintScripts(folderPath);
      await this.addTypeModuleToPackageJson(folderPath);
      await this.formatCode(folderPath);

      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `✅ Optimized project initialization completed in ${totalDuration}s`
      );

      return { uiFramework, diFramework, uiLibrary };
    } catch (error) {
      console.error('Optimized project initialization failed:', error);
      throw error;
    }
  }
  async installAwilix(folderPath: string): Promise<void> {
    const commandRunner = await this.initializeCommandRunner();
    await commandRunner.installPackages(['awilix'], folderPath);
    console.log('Awilix installed successfully!');
  }
  /**
   * Setup project with optimized package.json and lock file
   */
  private async setupOptimizedProject(
    folderPath: string,
    uiFramework: keyof UIFrameworks,
    diFramework: DiFramework
  ): Promise<void> {
    // Get the appropriate lock file configuration
    const lockConfig = WebContainerOptimizationService.getLockFileConfig(
      uiFramework,
      diFramework
    );

    if (!lockConfig) {
      throw new Error(
        `No lock file configuration found for ${uiFramework} + ${diFramework}`
      );
    }

    try {
      // Fetch the pre-generated package.json and package-lock.json
      const [packageJsonResponse, lockFileResponse] = await Promise.all([
        fetch(lockConfig.packageJsonPath),
        fetch(lockConfig.lockFilePath),
      ]);

      if (!packageJsonResponse.ok || !lockFileResponse.ok) {
        throw new Error(
          `Failed to fetch lock files: packageJson=${packageJsonResponse.status}, lockFile=${lockFileResponse.status}`
        );
      }

      const packageJsonContent = await packageJsonResponse.text();
      const lockFileContent = await lockFileResponse.text();

      // Write files to the project
      const packageJsonPath = `${folderPath}/package.json`.replace(/\/+/g, '/');
      const lockFilePath = `${folderPath}/package-lock.json`.replace(
        /\/+/g,
        '/'
      );

      await this.fileService.createFile(
        new FileEntity(packageJsonPath, packageJsonContent)
      );

      await this.fileService.createFile(
        new FileEntity(lockFilePath, lockFileContent)
      );

      console.log(`✓ Optimized project files setup complete`);
    } catch (error) {
      console.error('Failed to setup optimized project:', error);
      // Fallback to standard approach
      console.log('🔄 Falling back to standard project setup...');
      await this.setupStandardProject(folderPath, uiFramework, diFramework);
    }
  }

  /**
   * Fallback to standard project setup if lock files fail
   */
  private async setupStandardProject(
    folderPath: string,
    uiFramework: keyof UIFrameworks,
    diFramework: DiFramework
  ): Promise<void> {
    const packageJson = WebContainerOptimizationService.createPackageJson(
      uiFramework,
      diFramework
    );

    const packageJsonPath = `${folderPath}/package.json`.replace(/\/+/g, '/');
    await this.fileService.createFile(
      new FileEntity(packageJsonPath, JSON.stringify(packageJson, null, 2))
    );
  }

  /**
   * Fast dependency installation using lock file
   */
  private async fastInstallDependencies(folderPath: string): Promise<void> {
    console.log('Installing dependencies (optimized)...');

    const commandRunner = await this.initializeCommandRunner();
    const startTime = Date.now();
    // Use npm ci for faster installation with lock file
    await commandRunner.runCommand('npm ci --no-audit --no-fund', folderPath);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ Dependencies installed in ${duration}s (optimized)`);
  }

  /**
   * Setup UI framework-specific files
   */
  async setupUIFramework(
    folderPath: string,
    framework: keyof UIFrameworks,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    // This implementation depends on your existing framework setup logic
    // For now, we'll implement a basic version
    console.log(`Setting up ${framework} framework...`);

    if (framework === 'vanilla') {
      // Vanilla doesn't need additional setup
      return;
    }

    const commandRunner = await this.initializeCommandRunner();
    const tempDir = 'temp';
    const tempPath = `${folderPath}/${tempDir}`.replace(/\/+/g, '/');

    try {
      // Clean up any existing temp directory
      if (await this.fileService.fileExists(tempPath)) {
        await this.fileService.rmSync(tempPath);
      }

      progressCallback?.(10);

      switch (framework) {
        case 'react':
          await commandRunner.createViteProject(
            tempDir,
            'react-ts',
            folderPath
          );
          break;
        case 'vue':
          await commandRunner.createViteProject(tempDir, 'vue-ts', folderPath);
          break;
        case 'angular':
          await commandRunner.createAngularProject(tempDir, folderPath, [
            '--style=scss',
            '--routing',
            '--skip-git',
            '--skip-install',
            '--strict',
            '--inline-style=false',
            '--inline-template=false',
            '--defaults',
          ]);
          break;
        case 'lit':
          await commandRunner.createViteProject(tempDir, 'lit-ts', folderPath);
          break;
        default:
          console.warn(`Unsupported framework: ${framework}`);
      }

      progressCallback?.(80);

      // Move files from temp to main directory
      await this.helperFunctions.moveFilesAndCleanUp(tempPath, folderPath);
      await this.movePresentationFiles(folderPath, framework);

      progressCallback?.(100);
      console.log(`✓ ${framework} framework setup complete`);
    } catch (error) {
      console.error(`Failed to setup ${framework} framework:`, error);
      throw error;
    }
  }

  private async movePresentationFiles(
    folderPath: string,
    framework: keyof UIFrameworks
  ): Promise<void> {
    const srcPath = `${folderPath}/src`.replace(/\/+/g, '/');
    const presentationPath =
      `${folderPath}/src/Infrastructure/Presentation`.replace(/\/+/g, '/');

    if (!(await this.fileService.fileExists(presentationPath))) {
      await this.fileService.createDirectory(presentationPath);
    }

    if (framework === 'react') {
      const filesToMove = ['App.tsx', 'App.css'];
      for (const file of filesToMove) {
        const from = `${srcPath}/${file}`.replace(/\/+/g, '/');
        const to = `${presentationPath}/${file}`.replace(/\/+/g, '/');
        if (await this.fileService.fileExists(from)) {
          this.fileService.rename(from, to);
        }
      }

      const mainFile = `${srcPath}/main.tsx`.replace(/\/+/g, '/');
      await this.helperFunctions.updateMultipleImports(mainFile, {
        './App.tsx': './Infrastructure/Presentation/App.tsx',
      });
    } else if (framework === 'vue') {
      const from = `${srcPath}/App.vue`.replace(/\/+/g, '/');
      const to = `${presentationPath}/App.vue`.replace(/\/+/g, '/');
      if (await this.fileService.fileExists(from)) {
        this.fileService.rename(from, to);
      }

      await this.helperFunctions.createShimsVueFile(folderPath);
      await this.helperFunctions.changeToTypeImportSyntax(folderPath);

      const componentsDir = `${srcPath}/components`.replace(/\/+/g, '/');
      await this.helperFunctions.removeFile(componentsDir, 'HelloWorld.vue');
      await this.helperFunctions.removeDirectory(componentsDir);

      const mainFile = `${srcPath}/main.ts`.replace(/\/+/g, '/');
      await this.helperFunctions.updateMultipleImports(mainFile, {
        './App.vue': './Infrastructure/Presentation/App.vue',
      });
    } else if (framework === 'angular') {
      const appDir = `${srcPath}/app`.replace(/\/+/g, '/');
      if (await this.fileService.fileExists(appDir)) {
        await this.helperFunctions.copyFolderRecursiveSync(
          appDir,
          presentationPath
        );
        await this.fileService.rmSync(appDir);
      }

      const mainFile = `${srcPath}/main.ts`.replace(/\/+/g, '/');
      await this.helperFunctions.updateMultipleImports(mainFile, {
        './app/app.config': './Infrastructure/Presentation/app.config',
        './app/app': './Infrastructure/Presentation/app.component',
      });
    } else if (framework === 'lit') {
      await this.helperFunctions.removeFile(srcPath, 'my-element.ts');
    }

    console.log(`📁 Moving ${framework} files to presentation layer...`);
  }

  /**
   * Finalize project setup
   */
  private async finalizeProject(folderPath: string): Promise<void> {
    console.log('🔧 Finalizing project setup...');

    await this.initializeCommandRunner();

    try {
      // Add any final setup steps
      await this.createEslintConfig(folderPath);
      await this.addLintScripts(folderPath);
      await this.addTypeModuleToPackageJson(folderPath);
      await this.formatCode(folderPath);

      console.log('✓ Project finalization complete');
    } catch (error) {
      console.warn('Some finalization steps failed:', error);
      // Don't throw - project is still usable
    }
  }

  private async createEslintConfig(folderPath: string): Promise<void> {
    console.log('📝 Creating ESLint config...');

    const eslintConfig = `import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
];`;

    await this.fileService.createFile({
      filePath: `${folderPath}/eslint.config.js`.replace(/\/+/g, '/'),
      content: eslintConfig,
    });
  }

  private async addLintScripts(folderPath: string): Promise<void> {
    console.log('📝 Adding lint scripts...');

    const packageJsonPath = `${folderPath}/package.json`.replace(/\/+/g, '/');

    const packageJsonFile = await this.fileService.readFile(packageJsonPath);
    const packageJson = JSON.parse(packageJsonFile.content);

    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.lint = 'eslint . --ext .ts,.tsx,.js,.jsx';
    packageJson.scripts.format = 'prettier --write .';

    await this.fileService.createFile({
      filePath: packageJsonPath,
      content: JSON.stringify(packageJson, null, 2),
    });
  }

  private async addTypeModuleToPackageJson(folderPath: string): Promise<void> {
    const packageJsonPath = `${folderPath}/package.json`.replace(/\/+/g, '/');

    const packageJsonFile = await this.fileService.readFile(packageJsonPath);
    const packageJson = JSON.parse(packageJsonFile.content);

    packageJson.type = 'module';
    await this.fileService.createFile(
      new FileEntity(packageJsonPath, JSON.stringify(packageJson, null, 2))
    );
  }

  private async formatCode(folderPath: string): Promise<void> {
    const commandRunner = await this.initializeCommandRunner();
    await commandRunner.runCommand('npm run format', folderPath);
    console.log('Code formatted');
  }

  /**
   * Get installation time estimate
   */
  getEstimatedInstallTime(
    framework: keyof UIFrameworks,
    diFramework: DiFramework
  ): { optimized: number; standard: number } {
    const lockConfig = WebContainerOptimizationService.getLockFileConfig(
      framework,
      diFramework
    );

    return {
      optimized: lockConfig ? 5 : 50, // 5s with lock files, 50s without
      standard: 50,
    };
  }

  async setUpUiLibrary(
    folderPath: string,
    uiLibrary: UiLibrary
  ): Promise<FileEntity | undefined> {
    console.log(`Setting up ${uiLibrary} UI library...`);

    const commandRunner = await this.initializeCommandRunner();
    await this.uiLibrarySetupService.setupUILibrary(
      folderPath,
      uiLibrary,
      commandRunner
    );

    // Return the updated package.json
    const packageJsonPath = `${folderPath}/package.json`.replace(/\/+/g, '/');
    const packageJson = await this.fileService.readFile(packageJsonPath);
    return packageJson;
  }
}
