import { LintAppService } from './../../../../lib/application/services/lint-app-service';
import { ConfigurationAppService } from '@onion-initializr/lib/application/services/configuration-app-service';
import { FileService } from '@onion-initializr/lib/domain/services/file-service';
import chalk from 'chalk';
import { PathAppService } from '@onion-initializr/lib/application/services/path-app-service';
import { ICommandRunner } from '@onion-initializr/lib/domain/interfaces/icommand-runner';
import { IProjectService } from '@onion-initializr/lib/domain/interfaces/iproject-service';
import { DiFramework } from '@onion-initializr/lib/domain/entities/di-framework';
import { UiLibrary } from '@onion-initializr/lib/domain/entities/ui-library';
import { UIFrameworks } from '@onion-initializr/lib/domain/entities/ui-framework';
import { UILibrarySetupService } from '@onion-initializr/lib/application/services/uilibrary-setup-service';
import { select } from '@inquirer/prompts';

// Maps display name to internal framework key
const frameworkDisplayMap: Record<string, keyof UIFrameworks> = {
  'React (Vite + TS)': 'react',
  'Vue (Vite + TS)': 'vue',
  'Angular (Vite + TS)': 'angular',
  'Lit (Vite + TS)': 'lit',
  'Vanilla ': 'vanilla',
};

/**
 * Initializes the project structure, ESLint, UI framework, and DI setup.
 * @param folderPath - Base path of the project
 * @param uiFramework - Optional framework (react/vue/angular/lit/vanilla). If not provided, CLI will prompt.
 * @returns the framework key
 */
export class ProjectInitAppService implements IProjectService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService,
    private readonly commandRunner: ICommandRunner,
    private readonly lintAppService: LintAppService,
    private readonly configurationAppService: ConfigurationAppService,
    private readonly uiLibrarySetupService: UILibrarySetupService
  ) {}
  async isInitialized(folderPath: string): Promise<boolean> {
    const packageJson = this.pathService.join(folderPath, 'package.json');
    const srcDir = this.pathService.join(folderPath, 'src');
    return (
      (await this.fileService.fileExists(packageJson)) &&
      this.fileService.fileExists(srcDir)
    );
  }

  /**
   * Detect the UI framework and DI framework from an existing project
   */
  async detectFrameworks(folderPath: string): Promise<{
    uiFramework: keyof UIFrameworks;
    diFramework: DiFramework;
    uiLibrary: UiLibrary;
  }> {
    const packageJsonPath = this.pathService.join(folderPath, 'package.json');

    let uiFramework: keyof UIFrameworks = 'vanilla';
    let diFramework: DiFramework = 'awilix';
    let uiLibrary: UiLibrary = 'none';

    if (await this.fileService.fileExists(packageJsonPath)) {
      const packageJsonFile = await this.fileService.readFile(packageJsonPath);
      const packageJson = JSON.parse(packageJsonFile.content);
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Detect UI framework
      if (dependencies['react'] || dependencies['react-dom']) {
        uiFramework = 'react';
      } else if (dependencies['vue']) {
        uiFramework = 'vue';
      } else if (dependencies['@angular/core']) {
        uiFramework = 'angular';
      } else if (dependencies['lit']) {
        uiFramework = 'lit';
      }

      // Detect DI framework
      // If only Angular core is present (without Awilix), use Angular DI
      // Otherwise default to Awilix (even if Angular is present, Awilix takes precedence)
      if (dependencies['@angular/core'] && !dependencies['awilix']) {
        diFramework = 'angular';
      }
      // Default is already awilix

      // Detect UI library
      if (
        dependencies['@shadcn/ui'] ||
        dependencies['@radix-ui/react-avatar']
      ) {
        uiLibrary = 'shadcn';
      }
    }

    return { uiFramework, diFramework, uiLibrary };
  }

  async installAwilix(folderPath: string) {
    try {
      await this.commandRunner.runCommand('npm install awilix', folderPath);
      console.log(chalk.green('Awilix installed successfully!'));
    } catch (error) {
      console.error(chalk.red(`Failed to install Awilix: ${error}`));
    }
  }
  async formatCode(folderPath: string) {
    try {
      await this.commandRunner.runCommand(
        'npm i eslint-plugin-prettier',
        folderPath
      );
      await this.commandRunner.runCommand('npm run format', folderPath);
      console.log(chalk.green('Code formatted with Prettier!'));
    } catch (error) {
      console.error(chalk.red(`Failed to lint/format code: ${error}`));
    }
  }

  /**
   * Setup UI Library specific packages and configuration
   */
  async setUpUiLibrary(
    folderPath: string,
    uiLibrary: UiLibrary
  ): Promise<void> {
    console.log(chalk.yellow(`Setting up ${uiLibrary} UI library...`));

    try {
      await this.uiLibrarySetupService.setupUILibrary(
        folderPath,
        uiLibrary,
        this.commandRunner
      );
    } catch (error) {
      console.error(chalk.red(`❌ Failed to setup ${uiLibrary}:`), error);
      throw error;
    }
  }

  async initialize(
    folderPath: string,
    uiFramework?: keyof UIFrameworks,
    diFramework?: DiFramework,
    uiLibrary?: UiLibrary
  ): Promise<
    | {
        uiFramework: keyof UIFrameworks;
        diFramework: DiFramework;
        uiLibrary: UiLibrary;
      }
    | undefined
  > {
    try {
      await this.ensureNpmInit(folderPath);
      await this.installDevDependencies(folderPath);

      if (!uiFramework) {
        const selectedDisplayName = await select({
          message: 'Select a frontend framework to set up:',
          choices: Object.keys(frameworkDisplayMap).map(name => ({
            name,
            value: name,
          })),
        });
        uiFramework = frameworkDisplayMap[selectedDisplayName];
      }

      // Use passed parameters or default values
      diFramework = diFramework || 'awilix';
      uiLibrary = uiLibrary || 'none';

      if (uiFramework === 'angular') {
        const selectedDiFramework = await select({
          message:
            'What Dependency Injection Framework do you want to use ? (default: Awilix)',
          choices: [
            { name: 'Awilix', value: 'awilix' },
            { name: 'Angular', value: 'angular' },
          ],
        });
        diFramework = selectedDiFramework as DiFramework;
      } else if (uiFramework === 'react' && uiLibrary === 'none') {
        // Only prompt for UI library if not provided and using React
        const selectedUiLibrary = await select({
          message: 'What UI Library do you want to use ? (default: None)',
          choices: [
            { name: 'None', value: 'none' },
            { name: 'ShadCN', value: 'shadcn' },
          ],
        });
        uiLibrary = selectedUiLibrary as UiLibrary;
      }

      uiFramework = uiFramework || 'vanilla';
      await this.setupUIFramework(folderPath, uiFramework);

      // Set up UI Library if selected
      if (uiLibrary !== 'none') {
        await this.setUpUiLibrary(folderPath, uiLibrary as UiLibrary);
      }

      if (diFramework === 'awilix') {
        await this.installAwilix(folderPath);
      }
      this.lintAppService.createFlatEslintConfig(folderPath);
      await this.lintAppService.addLintScripts(folderPath);
      await this.lintAppService.addTypeModuleToPackageJson(folderPath);

      const tsConfigFile =
        await this.configurationAppService.updateVerbatimModuleSyntax(
          folderPath,
          false
        );
      if (tsConfigFile) {
        await this.fileService.createFile(tsConfigFile);
      }

      await this.formatCode(folderPath);

      return {
        uiFramework,
        diFramework: diFramework as DiFramework,
        uiLibrary: uiLibrary as UiLibrary,
      };
    } catch (error) {
      console.error(chalk.red('Project initialization failed.', error));
      return undefined;
    }
  }

  async ensureNpmInit(folderPath: string) {
    const packageJsonPath = this.pathService.join(folderPath, 'package.json');

    if (!(await this.fileService.fileExists(packageJsonPath))) {
      console.log(chalk.yellow('Initializing npm project...'));
      await this.commandRunner.runCommand('npm init -y', folderPath);
      console.log(chalk.green('npm project initialized successfully!'));
    }
  }

  async installDevDependencies(folderPath: string) {
    console.log(chalk.yellow('Installing ESLint and Prettier...'));
    await this.commandRunner.runCommand(
      'npm install --save-dev eslint prettier @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-prettier',
      folderPath
    );
    console.log(chalk.green('Prettier and ESLint installed successfully!'));
  }

  async setupUIFramework(folderPath: string, framework: keyof UIFrameworks) {
    console.log(
      chalk.yellow(`Setting up ${framework} project in ${folderPath}...`)
    );
    const tempDir = 'temp';
    const tempPath = this.pathService.join(folderPath, tempDir);
    let setupCommand = '';

    switch (framework) {
      case 'react':
        setupCommand = `npx --yes create-vite@latest ${tempDir} --template react-ts  --no-interactive`;
        break;
      case 'vue':
        setupCommand = `npx --yes create-vite@latest ${tempDir} --template vue-ts --no-interactive`;
        break;
      case 'angular':
        setupCommand = `npx @angular/cli@latest new ${tempDir} --directory ${tempDir} --style=scss --routing --skip-git --skip-install --strict --inline-style=false --inline-template=false --defaults`;
        break;
      case 'lit':
        setupCommand = `npx --yes create-vite@latest ${tempDir} --template lit-ts --no-interactive`;
    }

    if (framework !== 'vanilla') {
      await this.commandRunner.runCommand(setupCommand, folderPath);
      await this.moveFilesAndCleanUp(tempPath, folderPath);
      console.log(chalk.green(`${framework} project created successfully!`));

      this.movePresentationFiles(folderPath, framework);
    }
  }

  async movePresentationFiles(
    folderPath: string,
    framework: keyof UIFrameworks
  ) {
    const srcPath = this.pathService.join(folderPath, 'src');
    const presentationPath = this.pathService.join(
      folderPath,
      'src',
      'infrastructure',
      'presentation'
    );

    if (!(await this.fileService.fileExists(presentationPath))) {
      this.fileService.createDirectory(presentationPath);
    }

    if (framework === 'react') {
      ['App.tsx', 'App.css'].forEach(async file => {
        const from = this.pathService.join(srcPath, file);
        const to = this.pathService.join(presentationPath, file);
        if (await this.fileService.fileExists(from))
          this.fileService.rename(from, to);
      });

      const mainFile = this.pathService.join(srcPath, 'main.tsx');
      await this.updateMultipleImports(mainFile, {
        './App.tsx': './infrastructure/presentation/App.tsx',
      });
    } else if (framework === 'vue') {
      const from = this.pathService.join(srcPath, 'App.vue');
      const to = this.pathService.join(presentationPath, 'App.vue');
      if (await this.fileService.fileExists(from))
        this.fileService.rename(from, to);

      await this.createShimsVueFile(folderPath);
      await this.changeToTypeImportSyntax(folderPath);

      this.pathService.join(srcPath, 'components');
      const componentsDir = this.pathService.join(srcPath, 'components');
      await this.removeFile(componentsDir, 'HelloWorld.vue');
      await this.removeDirectory(componentsDir);

      const mainFile = this.pathService.join(srcPath, 'main.ts');
      await this.updateMultipleImports(mainFile, {
        './App.vue': './infrastructure/presentation/App.vue',
      });
    } else if (framework === 'angular') {
      const appDir = this.pathService.join(srcPath, 'app');
      if (await this.fileService.fileExists(appDir)) {
        await this.copyFolderRecursiveSync(appDir, presentationPath);
        await this.fileService.rmSync(appDir);
      }

      const mainFile = this.pathService.join(srcPath, 'main.ts');
      await this.updateMultipleImports(mainFile, {
        './app/app.config': './infrastructure/presentation/app.config',
        './app/app': './infrastructure/presentation/app.component',
      });
    } else if (framework === 'lit') {
      await this.removeFile(srcPath, 'my-element.ts');

      // Process Lit framework templates
      await this.processFrameworkTemplates(folderPath, framework);
    }
  }

  private async copyFolderRecursiveSync(
    source: string,
    target: string
  ): Promise<void> {
    if (!(await this.fileService.fileExists(target))) {
      await this.fileService.createDirectory(target);
    }

    const items = await this.fileService.readdir(source);

    for (const item of items) {
      const srcPath = this.pathService.join(source, item);
      const destPath = this.pathService.join(target, item);

      const stats = await this.fileService.getFileStats(srcPath);
      if (stats.isDirectory()) {
        await this.copyFolderRecursiveSync(srcPath, destPath);
      } else {
        await this.fileService.copyFile(srcPath, destPath);
      }
    }
  }

  private async moveFilesAndCleanUp(
    fromPath: string,
    toPath: string
  ): Promise<void> {
    await this.copyFolderRecursiveSync(fromPath, toPath);
    await this.fileService.rmSync(fromPath);
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async updateMultipleImports(
    filePath: string,
    replacements: Record<string, string>
  ): Promise<void> {
    if (!(await this.fileService.fileExists(filePath))) {
      return;
    }

    const fileEntity = await this.fileService.readFile(filePath);
    let content = fileEntity.content;

    for (const [oldPath, newPath] of Object.entries(replacements)) {
      const escapedOldPath = this.escapeRegExp(oldPath);
      const importRegex = new RegExp(
        `(import\\s+[^'"]*?['"])${escapedOldPath}(['"])`,
        'g'
      );

      content = content.replace(importRegex, `$1${newPath}$2`);
    }

    await this.fileService.createFile({
      filePath,
      content,
    });
  }

  private async createShimsVueFile(folderPath: string): Promise<void> {
    const shimsFilePath = this.pathService.join(folderPath, 'shims-vue.d.ts');
    const content = `declare module "*.vue" {
        import Vue from "vue";
        export default Vue;
    }`;

    await this.fileService.createFile({
      filePath: shimsFilePath,
      content,
    });
  }

  private async processFrameworkTemplates(
    folderPath: string,
    framework: string
  ): Promise<void> {
    if (framework !== 'lit') {
      return; // Only process Lit templates for now
    }

    // Path to framework templates
    const templatesPath = this.pathService.join(
      __dirname,
      '../..',
      'infrastructure',
      'frameworks',
      'templates',
      framework
    );

    // Check if templates directory exists
    if (!(await this.fileService.dirExists(templatesPath))) {
      console.log(`Framework templates not found for ${framework}`);
      return;
    }

    // Process index.html.hbs template
    const indexHtmlTemplatePath = this.pathService.join(
      templatesPath,
      'index.html.hbs'
    );
    if (await this.fileService.fileExists(indexHtmlTemplatePath)) {
      const templateContent = await this.fileService.readFile(
        indexHtmlTemplatePath
      );

      let processedContent = templateContent.content;

      // Write the processed index.html to the project root
      const indexHtmlPath = this.pathService.join(folderPath, 'index.html');
      await this.fileService.createFile({
        filePath: indexHtmlPath,
        content: processedContent,
      });
    }
  }

  private async changeToTypeImportSyntax(folderPath: string): Promise<void> {
    // Check if folderPath is actually a directory before trying to read it
    if (!(await this.fileService.dirExists(folderPath))) {
      return;
    }

    const items = await this.fileService.readdir(folderPath);

    for (const item of items) {
      const itemPath = this.pathService.join(folderPath, item);

      const isItemDir = await this.fileService.dirExists(itemPath);
      const isItemFile = await this.fileService.fileExists(itemPath);

      if (isItemDir && !isItemFile) {
        await this.changeToTypeImportSyntax(itemPath);
      } else if (item.endsWith('.ts')) {
        const fileEntity = await this.fileService.readFile(itemPath);
        let content = fileEntity.content;
        const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;

        content = content.replace(
          importRegex,
          (match: string, imports: string, modulePath: string) => {
            if (modulePath.includes('Interfaces')) {
              return `import type {${imports}} from '${modulePath}'`;
            }
            return match;
          }
        );

        await this.fileService.createFile({
          filePath: itemPath,
          content,
        });
      }
    }
  }

  private async removeFile(
    folderPath: string,
    filename: string
  ): Promise<void> {
    const filePath = this.pathService.join(folderPath, filename);

    try {
      if (await this.fileService.fileExists(filePath)) {
        await this.fileService.rmSync(filePath);
        console.log(
          `\nFile ${filename} removed successfully from ${folderPath}`
        );
      }
    } catch (error) {
      console.error(`Error removing file: ${error}`);
    }
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    if (await this.fileService.dirExists(dirPath)) {
      await this.fileService.rmSync(dirPath);
    }
  }
}
