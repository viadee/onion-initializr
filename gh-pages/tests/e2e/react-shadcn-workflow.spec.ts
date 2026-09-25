import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);

interface TestProject {
  projectName: string;
}

class ProjectRunner {
  /** Detects typical startup messages in the development server's standard output.
      A match is used as a signal that startup has succeeded.*/
  private static isStartupMessage(data: string): boolean {
    return (
      data.includes('Local:') ||
      data.includes('localhost') ||
      data.includes('ready') ||
      data.includes('compiled') ||
      data.includes('serve')
    );
  }

  // Detects error message in the development server's standard error output.
  private static isErrorMessage(data: string): boolean {
    return data.includes('Error:') || data.includes('EADDRINUSE');
  }

  //Starts the generated project using the specified command in its directory and watches the process output
  static async startProject(
    projectPath: string,
    command: string
  ): Promise<void> {
    console.log(`Starting project with command: ${command}`);
    return new Promise<void>((resolve, reject) => {
      const startupTimeoutTime = 45000; // 45 seconds
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
          }, 2000);
        }
      };

      const handleError = (message: string) => {
        if (!hasStarted) {
          cleanup();
          reject(new Error(message));
        }
      };

      const startupTimeout = setTimeout(() => {
        handleError(`Project failed to start within ${startupTimeoutTime}ms`);
      }, startupTimeoutTime);

      // Listen for startup messages in the project's standard output.
      process.stdout?.on('data', (data: string) => {
        console.log('Project stdout:', data);
        if (ProjectRunner.isStartupMessage(data)) {
          handleSuccess();
        }
      });

      // Listen for error messages in the project's standard error output.
      process.stderr?.on('data', (data: string) => {
        console.log('Project stderr:', data);
        if (ProjectRunner.isErrorMessage(data)) {
          handleError(`Project startup failed: ${data}`);
        }
      });

      // Handle process exit and error events to ensure proper cleanup and resolution of the promise.
      process.on('exit', code => {
        clearTimeout(startupTimeout);
        if (!hasStarted && code !== 0) {
          reject(new Error(`Project exited with code ${code}`));
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

test.describe('React Project generation Workflow with ShadCN E2E Tests', () => {
  let page: Page;
  let testProject: TestProject;
  let tempDir: string;

  test.setTimeout(600000); // limit to 10 minutes to account for installation and startup steps

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });

    page = await context.newPage();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-e2e-'));

    testProject = {
      projectName: 'test-onion-project',
    };

    await page.goto('http://localhost:4200/onion-initializr/home');
  });

  test.afterEach(async () => {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 500,
        });
      } catch (error) {
        console.warn('Failed to cleanup temp directory:', error);
      }
    }
  });

  test('should handle React project generation and execution', async () => {
    await setupReactShadCNProject(page);

    const downloadPath = await downloadProject(page);
    const extractPath = await extractProject(downloadPath);

    await verifyReactProjectStructure(extractPath);
    await installDependencies(extractPath);
    await startAndVerifyReactProject(extractPath);
  });

  async function setupReactShadCNProject(page: Page) {
    // Navigate to the generator page
    await page.getByRole('button', { name: 'Try Online Now' }).first().click();
    await page.getByRole('button', { name: 'Skip Tutorial' }).click();

    await page.fill(
      'input.text-input[placeholder="Enter Project name"]',
      testProject.projectName
    );

    // Add a new entity
    await page.getByRole('textbox', { name: 'Entity' }).click();
    await page.getByRole('textbox', { name: 'Entity' }).fill('Supplier');
    await page.getByRole('button', { name: 'Add Entity' }).click();

    // Add a new domain service
    await page
      .getByRole('textbox', { name: 'Domain Service' })
      .fill('Procurement');
    await page.getByRole('textbox', { name: 'Domain Service' }).click();
    await page
      .getByRole('textbox', { name: 'Domain Service' })
      .fill('ProcurementService');
    await page.getByRole('button', { name: 'Add Domain Service' }).click();

    // Add a new application service
    await page.getByRole('textbox', { name: 'Application Service' }).click();
    await page
      .getByRole('textbox', { name: 'Application Service' })
      .fill('SupplierAppService');
    await page.getByRole('button', { name: 'Add Application Service' }).click();

    await page.getByRole('button', { name: 'shadcn logo ShadCN' }).click();
    await page
      .getByRole('button', { name: 'shadcn logo ShadCN' })
      .press('ArrowDown');

    await page.waitForTimeout(1000);
  }

  async function downloadProject(page: Page): Promise<string> {
    return new Promise((resolve, reject) => {
      const downloadTimeout = setTimeout(() => {
        reject(new Error('Download timeout after 300 seconds'));
      }, 300000);

      page.on('download', async download => {
        try {
          clearTimeout(downloadTimeout);
          const downloadPath = path.join(
            tempDir,
            await download.suggestedFilename()
          );
          await download.saveAs(downloadPath);

          expect(fs.existsSync(downloadPath)).toBeTruthy();
          expect(fs.statSync(downloadPath).size).toBeGreaterThan(0);

          resolve(downloadPath);
        } catch (error) {
          clearTimeout(downloadTimeout);
          reject(error);
        }
      });

      (async () => {
        try {
          await page.click('#generate');
        } catch (error) {
          clearTimeout(downloadTimeout);
          reject(error);
        }
      })();
    });
  }

  async function extractProject(zipPath: string): Promise<string> {
    const extractDir = path.join(tempDir, 'extracted');

    fs.mkdirSync(extractDir, { recursive: true });

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    const extractedContents = fs.readdirSync(extractDir);
    expect(extractedContents.length).toBeGreaterThan(0);

    console.log('Extracted contents:', extractedContents);

    if (fs.existsSync(path.join(extractDir, 'package.json'))) {
      console.log('Project files extracted directly to:', extractDir);
      return extractDir;
    }

    for (const item of extractedContents) {
      const itemPath = path.join(extractDir, item);
      if (
        fs.statSync(itemPath).isDirectory() &&
        fs.existsSync(path.join(itemPath, 'package.json'))
      ) {
        console.log('Found project directory:', item);
        return itemPath;
      }
    }

    throw new Error(
      'Could not find project directory with package.json in extracted contents'
    );
  }

  async function verifyProjectStructure(projectPath: string) {
    console.log('Project path:', projectPath);
    console.log('Contents:', fs.readdirSync(projectPath));

    if (fs.existsSync(path.join(projectPath, 'src'))) {
      console.log(
        'src contents:',
        fs.readdirSync(path.join(projectPath, 'src'))
      );
    }

    const expectedDirs = [
      'src',
      'src/Domain',
      'src/Application',
      'src/Infrastructure',
    ];

    for (const dir of expectedDirs) {
      const dirPath = path.join(projectPath, dir);
      console.log(
        `Checking directory: ${dirPath} - exists: ${fs.existsSync(dirPath)}`
      );
      expect(fs.existsSync(dirPath)).toBeTruthy();
      expect(fs.statSync(dirPath).isDirectory()).toBeTruthy();
    }

    const packageJsonPath = path.join(projectPath, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBeTruthy();

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.dev || packageJson.scripts.start).toBeDefined();
  }

  async function verifyReactProjectStructure(projectPath: string) {
    await verifyProjectStructure(projectPath);

    const reactFiles = ['src/main.tsx', 'src/App.tsx', 'vite.config.ts'];

    for (const file of reactFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        expect(fs.statSync(filePath).isFile()).toBeTruthy();
      }
    }
  }

  async function installDependencies(projectPath: string) {
    console.log(`Installing dependencies in ${projectPath}`);

    try {
      const { stdout, stderr } = await execAsync('npm install', {
        cwd: projectPath,
        timeout: 120000,
      });

      console.log('npm install stdout:', stdout);
      if (stderr) {
        console.log('npm install stderr:', stderr);
      }

      const nodeModulesPath = path.join(projectPath, 'node_modules');
      expect(fs.existsSync(nodeModulesPath)).toBeTruthy();
    } catch (error) {
      console.error('npm install failed:', error);
      throw error;
    }
  }

  async function startAndVerifyReactProject(projectPath: string) {
    await ProjectRunner.startProject(projectPath, 'npm run dev');
  }
});
