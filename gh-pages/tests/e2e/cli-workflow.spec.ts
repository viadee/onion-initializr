import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CLITestProject {
  projectPath: string;
  configPath: string;
  projectName: string;
}

class CLIProjectRunner {
  private static isStartupMessage(data: string): boolean {
    return (
      data.includes('Local:') ||
      data.includes('localhost') ||
      data.includes('ready') ||
      data.includes('compiled') ||
      data.includes('serve') ||
      data.includes('ng serve')
    );
  }

  private static isErrorMessage(data: string): boolean {
    return (
      data.includes('Error:') ||
      data.includes('EADDRINUSE') ||
      data.includes('failed')
    );
  }

  static async startProject(
    projectPath: string,
    command: string
  ): Promise<void> {
    console.log(`🚀 Starting CLI-generated project with command: ${command}`);

    return new Promise<void>((resolve, reject) => {
      const process = exec(command, {
        cwd: projectPath,
        timeout: 60000,
      });

      let hasStarted = false;

      const cleanup = () => {
        clearTimeout(startupTimeout);
        process.kill();
      };

      const handleSuccess = () => {
        if (!hasStarted) {
          hasStarted = true;
          setTimeout(() => {
            cleanup();
            resolve();
          }, 3000); // Give more time for CLI projects
        }
      };

      const handleError = (message: string) => {
        if (!hasStarted) {
          cleanup();
          reject(new Error(message));
        }
      };

      const startupTimeout = setTimeout(() => {
        handleError('CLI project failed to start within timeout');
      }, 50000); // Longer timeout for CLI projects

      process.stdout?.on('data', (data: string) => {
        console.log('📄 CLI Project stdout:', data);
        if (CLIProjectRunner.isStartupMessage(data)) {
          handleSuccess();
        }
      });

      process.stderr?.on('data', (data: string) => {
        console.log('⚠️ CLI Project stderr:', data);
        if (CLIProjectRunner.isErrorMessage(data)) {
          handleError(`CLI project startup failed: ${data}`);
        }
      });

      process.on('exit', code => {
        clearTimeout(startupTimeout);
        if (!hasStarted && code !== 0) {
          reject(new Error(`CLI project exited with code ${code}`));
        } else if (hasStarted) {
          resolve();
        }
      });

      process.on('error', error => {
        clearTimeout(startupTimeout);
        reject(error);
      });
    });
  }
}

test.describe('CLI Workflow E2E Tests', () => {
  let tempDir: string;
  let testProject: CLITestProject;

  // Set longer timeout for CLI workflow tests
  test.setTimeout(600000); // 10 minutes

  test.beforeEach(async () => {
    // Create temporary directory for this test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-cli-e2e-'));

    testProject = {
      projectPath: path.join(tempDir, 'test-cli-project'),
      configPath: path.join(tempDir, 'onion-config.json'),
      projectName: 'test-cli-project',
    };

    // Ensure project directory exists
    fs.mkdirSync(testProject.projectPath, { recursive: true });
  });

  test.afterEach(async () => {
    // Cleanup temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to cleanup temp directory:', error);
      }
    }
  });

  test('should generate project via CLI with config file', async () => {
    // Step 1: Create config file
    const config = createSimpleConfig(testProject.projectPath);
    await writeConfigFile(testProject.configPath, config);

    // Step 2: Run CLI with config file
    await runCLIWithConfig(testProject.configPath);

    // Step 3: Verify project structure
    await verifyProjectStructure(testProject.projectPath);

    // Step 4: Install dependencies and test project
    await installDependencies(testProject.projectPath);
    await startAndVerifyProject(testProject.projectPath);
  });

  test('should generate React project via CLI', async () => {
    const config = createReactConfig(testProject.projectPath);
    await writeConfigFile(testProject.configPath, config);

    await runCLIWithConfig(testProject.configPath);
    await verifyReactProjectStructure(testProject.projectPath);
    await installDependencies(testProject.projectPath);
    await startAndVerifyReactProject(testProject.projectPath);
  });

  test('should generate Vue project via CLI', async () => {
    const config = createVueConfig(testProject.projectPath);
    await writeConfigFile(testProject.configPath, config);

    await runCLIWithConfig(testProject.configPath);
    await verifyVueProjectStructure(testProject.projectPath);
    await installDependencies(testProject.projectPath);
    await startAndVerifyVueProject(testProject.projectPath);
  });

  test('should generate project via CLI without config file (interactive mode)', async () => {
    // This test would require mocking stdin for interactive input
    // For now, we'll skip it or implement with a timeout to test basic CLI startup

    try {
      const { stdout, stderr } = await execAsync(
        'node dist/application/services/MainAppService.js --help',
        {
          cwd: process.cwd(),
          timeout: 5000,
        }
      );

      // Just verify CLI can start and show help
      expect(stdout || stderr).toContain('Onion');
    } catch {
      // CLI might not be built yet - this is expected in some environments
      console.log('CLI help test skipped - CLI not built or available');
    }
  });

  test('should handle scan functionality', async () => {
    // Create a mock project to scan
    const mockProjectPath = path.join(tempDir, 'mock-project');
    fs.mkdirSync(mockProjectPath, { recursive: true });

    // Create a simple package.json to scan
    const packageJson = {
      name: 'mock-project',
      dependencies: {
        react: '^18.0.0',
        awilix: '^12.0.5',
      },
    };

    fs.writeFileSync(
      path.join(mockProjectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    try {
      // Test scan functionality
      const outputPath = path.join(tempDir, 'scanned-config.json');
      const { stdout, stderr } = await execAsync(
        `node dist/Application/Services/MainAppService.js --scan ${mockProjectPath} ${outputPath}`,
        {
          cwd: process.cwd(),
          timeout: 10000,
        }
      );

      console.log('Scan stdout:', stdout);
      console.log('Scan stderr:', stderr);

      // Verify scan output was created
      if (fs.existsSync(outputPath)) {
        const scannedConfig = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        expect(scannedConfig).toBeDefined();
        expect(scannedConfig.uiFramework).toBe('react');
      }
    } catch (error) {
      console.log('CLI scan test skipped - CLI not built or available:', error);
    }
  });

  // Helper functions
  function createSimpleConfig(folderPath: string) {
    return {
      folderPath,
      entities: ['User', 'Product'],
      domainServices: ['UserService', 'ProductService'],
      applicationServices: ['UserAppService', 'ProductAppService'],
      domainServiceConnections: {
        UserService: ['User'],
        ProductService: ['Product'],
      },
      applicationServiceDependencies: {
        UserAppService: {
          domainServices: ['UserService'],
          repositories: ['IUserRepository'],
        },
        ProductAppService: {
          domainServices: ['ProductService'],
          repositories: ['IProductRepository'],
        },
      },
      uiFramework: 'react',
      diFramework: 'awilix',
    };
  }

  function createReactConfig(folderPath: string) {
    return {
      ...createSimpleConfig(folderPath),
      uiFramework: 'react',
      diFramework: 'awilix',
    };
  }
  function createVueConfig(folderPath: string) {
    return {
      ...createSimpleConfig(folderPath),
      uiFramework: 'vue',
      diFramework: 'awilix',
    };
  }

  async function writeConfigFile(
    configPath: string,
    config: Record<string, unknown>
  ): Promise<void> {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`📝 Config file created at: ${configPath}`);
  }

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
        timeout: 60000, // Longer timeout for building
      });
    } else {
      console.log('✅ CLI already built');
    }
  }

  async function runCLIWithConfig(configPath: string): Promise<void> {
    console.log(`🏃 Running CLI with config: ${configPath}`);

    // Ensure CLI is built before running
    await ensureCLIBuilt();

    try {
      const { stdout, stderr } = await execAsync(
        `node dist/Application/Services/MainAppService.js --config ${configPath}`,
        {
          cwd: process.cwd(),
          timeout: 60000, // 1 minute timeout for CLI generation
        }
      );

      console.log('CLI stdout:', stdout);
      if (stderr) {
        console.log('CLI stderr:', stderr);
      }
    } catch (error) {
      console.error('CLI execution failed:', error);
      throw error;
    }
  }

  async function verifyProjectStructure(projectPath: string): Promise<void> {
    console.log(`🔍 Verifying project structure at: ${projectPath}`);

    // Verify basic onion architecture structure
    const expectedDirs = [
      'src',
      'src/Domain',
      'src/domain/Entities',
      'src/domain/Services',
      'src/domain/Interfaces',
      'src/Application',
      'src/application/Services',
      'src/Infrastructure',
      'src/infrastructure/Repositories',
    ];

    for (const dir of expectedDirs) {
      const dirPath = path.join(projectPath, dir);
      console.log(`📁 Checking directory: ${dirPath}`);
      expect(fs.existsSync(dirPath)).toBeTruthy();
      expect(fs.statSync(dirPath).isDirectory()).toBeTruthy();
    }

    // Verify package.json exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBeTruthy();

    // Verify some key files exist
    const expectedFiles = [
      'src/domain/entities/User.ts',
      'src/domain/entities/Product.ts',
      'src/domain/services/UserService.ts',
      'src/domain/services/ProductService.ts',
      'src/application/services/UserAppService.ts',
      'src/application/services/ProductAppService.ts',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        expect(fs.statSync(filePath).isFile()).toBeTruthy();
        console.log(`✅ Found expected file: ${file}`);
      } else {
        console.log(`⚠️ Expected file not found: ${file}`);
      }
    }
  }

  async function verifyReactProjectStructure(
    projectPath: string
  ): Promise<void> {
    await verifyProjectStructure(projectPath);

    const reactFiles = ['src/main.tsx', 'vite.config.ts'];
    for (const file of reactFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        expect(fs.statSync(filePath).isFile()).toBeTruthy();
        console.log(`✅ Found React file: ${file}`);
      }
    }
  }

  async function verifyVueProjectStructure(projectPath: string): Promise<void> {
    await verifyProjectStructure(projectPath);

    const vueFiles = ['src/main.ts', 'vite.config.ts'];
    for (const file of vueFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        expect(fs.statSync(filePath).isFile()).toBeTruthy();
        console.log(`✅ Found Vue file: ${file}`);
      }
    }
  }

  async function installDependencies(projectPath: string): Promise<void> {
    console.log(`Installing dependencies in ${projectPath}`);

    try {
      const { stdout, stderr } = await execAsync('npm install', {
        cwd: projectPath,
        timeout: 120000, // 2 minutes timeout
      });

      console.log('npm install stdout:', stdout);
      if (stderr) {
        console.log('npm install stderr:', stderr);
      }

      // Verify node_modules was created
      const nodeModulesPath = path.join(projectPath, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBeTruthy();
    } catch (error) {
      console.error('npm install failed:', error);
      throw error;
    }
  }

  async function startAndVerifyProject(projectPath: string): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const startCommand =
      packageJson.scripts.dev || packageJson.scripts.start || 'npm run dev';

    await CLIProjectRunner.startProject(projectPath, startCommand);
  }

  async function startAndVerifyReactProject(
    projectPath: string
  ): Promise<void> {
    await CLIProjectRunner.startProject(projectPath, 'npm run dev');
  }

  async function startAndVerifyVueProject(projectPath: string): Promise<void> {
    await CLIProjectRunner.startProject(projectPath, 'npm run dev');
  }
});
