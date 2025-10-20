import { FileService } from '../../domain/services/file-service';
import { PathAppService } from './path-app-service';
import { FileEntity } from '../../domain/entities/file-entity';

export class LintAppService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}

  createFlatEslintConfig(folderPath: string): void {
    const configContent = `
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        process: "readonly",
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
`.trim();

    const filePath = this.pathService.join(folderPath, 'eslint.config.js');
    this.fileService.createFile(new FileEntity(filePath, configContent));
  }

  async addLintScripts(folderPath: string): Promise<void> {
    const pkgPath = this.pathService.join(folderPath, 'package.json');
    const pkgFile = await this.fileService.readFile(pkgPath);
    const pkg = JSON.parse(pkgFile.content);

    pkg.scripts = {
      ...(pkg.scripts || {}),
      lint: 'eslint . --ext .ts',
      format: 'prettier --write .',
    };

    await this.fileService.createFile(
      new FileEntity(pkgPath, JSON.stringify(pkg, null, 2))
    );
  }

  async addTypeModuleToPackageJson(folderPath: string): Promise<void> {
    const pkgPath = this.pathService.join(folderPath, 'package.json');
    const pkgFile = await this.fileService.readFile(pkgPath);
    const pkg = JSON.parse(pkgFile.content);

    pkg.type = 'module';

    await this.fileService.createFile(
      new FileEntity(pkgPath, JSON.stringify(pkg, null, 2))
    );
  }
}
