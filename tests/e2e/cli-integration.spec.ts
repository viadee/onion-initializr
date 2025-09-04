import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('CLI Integration Tests', () => {
  let tempDir: string;

  // Set longer timeout for CLI tests
  test.setTimeout(600000); // 10 minutes

  test.beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-cli-integration-'));
  });

  test.afterEach(async () => {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to cleanup temp directory:', error);
      }
    }
  });

  test('should build CLI successfully', async () => {
    try {
      console.log('🔨 Building CLI...');
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: process.cwd(),
        timeout: 30000, // 30 seconds
      });

      console.log('Build stdout:', stdout);
      if (stderr) {
        console.log('Build stderr:', stderr);
      }

      // Verify the CLI build output exists
      const cliPath = path.join(
        process.cwd(),
        'dist',
        'Application',
        'Services',
        'MainAppService.js'
      );
      expect(fs.existsSync(cliPath)).toBeTruthy();

      console.log('✅ CLI built successfully');
    } catch (error) {
      console.error('CLI build failed:', error);
      throw error;
    }
  });

  test('should show help when CLI is run with --help', async () => {
    // First ensure CLI is built
    await ensureCLIBuilt();

    try {
      const { stdout, stderr } = await execAsync(
        'node dist/Application/Services/MainAppService.js --help',
        {
          cwd: process.cwd(),
          timeout: 10000,
        }
      );

      const output = stdout || stderr;
      expect(output).toContain('Onion Architecture Generator');
      expect(output).toContain('USAGE');
      expect(output).toContain('--config');
      expect(output).toContain('--scan');

      console.log('✅ CLI help command works correctly');
    } catch (error) {
      console.error('CLI help test failed:', error);
      throw error;
    }
  });

  test('should generate basic project structure with config file', async () => {
    await ensureCLIBuilt();

    const projectPath = path.join(tempDir, 'test-project');
    const configPath = path.join(tempDir, 'test-config.json');

    // Create a basic config
    const config = {
      folderPath: projectPath,
      entities: ['User'],
      domainServices: ['UserService'],
      applicationServices: ['UserAppService'],
      domainServiceConnections: {
        UserService: ['User'],
      },
      applicationServiceDependencies: {
        UserAppService: {
          domainServices: ['UserService'],
          repositories: ['IUserRepository'],
        },
      },
      uiFramework: 'react',
      diFramework: 'awilix',
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    try {
      console.log(`🏗️ Generating project with config: ${configPath}`);
      const { stdout, stderr } = await execAsync(
        `node dist/Application/Services/MainAppService.js --config "${configPath}"`
      );

      console.log('Generation stdout:', stdout);
      if (stderr) {
        console.log('Generation stderr:', stderr);
      }

      // Verify basic project structure was created
      expect(fs.existsSync(projectPath)).toBeTruthy();
      expect(fs.existsSync(path.join(projectPath, 'src'))).toBeTruthy();
      expect(
        fs.existsSync(path.join(projectPath, 'src', 'Domain'))
      ).toBeTruthy();
      expect(
        fs.existsSync(path.join(projectPath, 'src', 'Application'))
      ).toBeTruthy();
      expect(
        fs.existsSync(path.join(projectPath, 'src', 'Infrastructure'))
      ).toBeTruthy();

      // Verify specific files were created
      expect(
        fs.existsSync(
          path.join(projectPath, 'src', 'Domain', 'Entities', 'User.ts')
        )
      ).toBeTruthy();
      expect(
        fs.existsSync(
          path.join(projectPath, 'src', 'Domain', 'Services', 'UserService.ts')
        )
      ).toBeTruthy();
      expect(
        fs.existsSync(
          path.join(
            projectPath,
            'src',
            'Application',
            'Services',
            'UserAppService.ts'
          )
        )
      ).toBeTruthy();

      console.log('✅ CLI project generation successful');
    } catch (error) {
      console.error('CLI project generation failed:', error);
      throw error;
    }
  });

  test('should handle scan functionality on a mock project', async () => {
    await ensureCLIBuilt();

    // Create a mock project structure to scan
    const mockProjectPath = path.join(tempDir, 'mock-project');
    await createMockProject(mockProjectPath);

    const outputConfigPath = path.join(tempDir, 'scanned-config.json');

    try {
      console.log(`🔍 Scanning mock project: ${mockProjectPath}`);
      const { stdout, stderr } = await execAsync(
        `node dist/Application/Services/MainAppService.js --scan "${mockProjectPath}" "${outputConfigPath}"`,
        {
          cwd: process.cwd(),
          timeout: 30000,
        }
      );

      console.log('Scan stdout:', stdout);
      if (stderr) {
        console.log('Scan stderr:', stderr);
      }

      // Verify scan output was created
      expect(fs.existsSync(outputConfigPath)).toBeTruthy();

      const scannedConfig = JSON.parse(
        fs.readFileSync(outputConfigPath, 'utf-8')
      );
      expect(scannedConfig).toBeDefined();
      expect(scannedConfig.entities).toContain('Product');
      expect(scannedConfig.domainServices).toContain('ProductService');
      expect(scannedConfig.uiFramework).toBe('react');

      console.log('✅ CLI scan functionality works correctly');
    } catch (error) {
      console.error('CLI scan test failed:', error);
      throw error;
    }
  });

  // Helper functions
  async function ensureCLIBuilt(): Promise<void> {
    const cliPath = path.join(
      process.cwd(),
      'dist',
      'Application',
      'Services',
      'MainAppService.js'
    );

    if (!fs.existsSync(cliPath)) {
      console.log('🔨 CLI not found, building...');
      await execAsync('npm run build', {
        cwd: process.cwd(),
        timeout: 30000,
      });
    }
  }

  async function createMockProject(projectPath: string): Promise<void> {
    // Create basic project structure
    const srcPath = path.join(projectPath, 'src');
    const domainPath = path.join(srcPath, 'Domain');
    const entitiesPath = path.join(domainPath, 'Entities');
    const servicesPath = path.join(domainPath, 'Services');
    const appPath = path.join(srcPath, 'Application', 'Services');

    fs.mkdirSync(appPath, { recursive: true });
    fs.mkdirSync(entitiesPath, { recursive: true });
    fs.mkdirSync(servicesPath, { recursive: true });

    // Create mock package.json
    const packageJson = {
      name: 'mock-project',
      dependencies: {
        react: '^18.0.0',
        awilix: '^12.0.5',
      },
    };
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create mock Entity
    const productEntity = `
export class Product {
  constructor(
    public id: string,
    public name: string,
    public price: number
  ) {}
}`;
    fs.writeFileSync(path.join(entitiesPath, 'Product.ts'), productEntity);

    // Create mock Domain Service
    const productService = `
import { Product } from '../Entities/Product';

export class ProductService {
  constructor(
    private readonly product: Product
  ) {}

  public exampleMethod(): void {
    // Implementation here
  }
}`;
    fs.writeFileSync(
      path.join(servicesPath, 'ProductService.ts'),
      productService
    );

    // Create mock Application Service
    const productAppService = `
import { ProductService } from '../../Domain/Services/ProductService';
import { IProductRepository } from '../../Domain/Interfaces/IProductRepository';

export class ProductAppService {
  constructor(
    private readonly productService: ProductService,
    private readonly productRepository: IProductRepository
  ) {}

  public async runExampleUseCase(): Promise<void> {
    // Implementation here
  }
}`;
    fs.writeFileSync(
      path.join(appPath, 'ProductAppService.ts'),
      productAppService
    );

    console.log(`📁 Mock project created at: ${projectPath}`);
  }
});
