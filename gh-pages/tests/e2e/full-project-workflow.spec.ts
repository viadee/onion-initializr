import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);

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
  static startProject(projectPath: string, command: string): Promise<void> {
    console.log(`Starting project with command: ${command}`);

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
        handleError('Project failed to start within timeout');
      }, 45000);

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

test.describe('Project Generation and Execution for Lit, React, and Angular', () => {
  let page: Page;
  let projectName: string;
  let tempDir: string;

  // Set longer timeout for all tests
  test.setTimeout(600000); // 10 minutes

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });

    page = await context.newPage();

    // Create temporary directory for the test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-e2e-'));

    projectName = 'test-onion-project';

    await page.goto('http://localhost:4200/onion-initializr/home');
  });

  test('should handle Lit project generation and execution', async () => {
    // Configure Lit-specific project
    await selectLitProject(page);

    const downloadPath = await downloadProject(page);
    const extractPath = extractProject(downloadPath);

    verifyLitProject(extractPath);
    await installDependencies(extractPath);
    await startAndVerifyReactOrLitProject(extractPath);
  });

  test('should handle React project generation and execution', async () => {
    // Configure React-specific project
    await selectReactProject(page);

    const downloadPath = await downloadProject(page);
    const extractPath = extractProject(downloadPath);

    verifyReactProjectStructure(extractPath);
    await installDependencies(extractPath);
    await startAndVerifyReactOrLitProject(extractPath);
  });

  test('should handle Angular project generation and execution', async () => {
    // Configure Angular-specific project
    await selectAngularProject(page);

    const downloadPath = await downloadProject(page);
    const extractPath = extractProject(downloadPath);

    verifyAngularProjectStructure(extractPath);
    await installDependencies(extractPath);
    await startAndVerifyAngularProject(extractPath);
  });

  async function configureOnionProject(page: Page) {
    // Navigate to the generator page
    await page.getByRole('button', { name: 'Try Online Now' }).first().click();
    await page.getByRole('button', { name: 'Skip Tutorial' }).click();

    // Set project name using the actual input selector
    await page.fill(
      'input.text-input[placeholder="Enter Project name"]',
      projectName
    );

    // Add an entity
    await page.getByRole('textbox', { name: 'Entity' }).click();
    await page.getByRole('textbox', { name: 'Entity' }).fill('Supplier');
    await page.getByRole('button', { name: 'Add Entity' }).click();

    // Add a domain service
    await page
      .getByRole('textbox', { name: 'Domain Service' })
      .fill('Procurement');
    await page.getByRole('textbox', { name: 'Domain Service' }).click();
    await page
      .getByRole('textbox', { name: 'Domain Service' })
      .fill('ProcurementService');
    await page.getByRole('button', { name: 'Add Domain Service' }).click();

    // Add an application service
    await page.getByRole('textbox', { name: 'Application Service' }).click();
    await page
      .getByRole('textbox', { name: 'Application Service' })
      .fill('SupplierAppService');
    await page.getByRole('button', { name: 'Add Application Service' }).click();

    // Wait for configuration to be processed
    await page.waitForTimeout(1000);
  }

  async function selectReactProject(page: Page) {
    await configureOnionProject(page);
    // React framework is selected by default, so no additional action is needed here
  }

  async function selectAngularProject(page: Page) {
    await configureOnionProject(page);

    // Select Angular framework
    const angularButton = page
      .locator('button.framework-btn:has(span:text("angular"))')
      .first();
    await expect(angularButton).toBeVisible({ timeout: 10000 });
    await angularButton.click();
    await page.waitForTimeout(1000);
  }

  async function selectLitProject(page: Page) {
    await configureOnionProject(page);

    // Select Lit framework
    const litButton = page
      .locator('button.framework-btn:has(span:text("lit"))')
      .first();
    await litButton.click();
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

          // Verify download was successful
          expect(fs.existsSync(downloadPath)).toBeTruthy();
          expect(fs.statSync(downloadPath).size).toBeGreaterThan(0);

          resolve(downloadPath);
        } catch (error) {
          clearTimeout(downloadTimeout);
          reject(error);
        }
      });

      // Trigger download
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

  function extractProject(zipPath: string): string {
    const extractDir = path.join(tempDir, 'extracted');

    // Create extraction directory
    fs.mkdirSync(extractDir, { recursive: true });

    // Extract using adm-zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    // Find the actual project directory (it might be nested)
    const extractedContents = fs.readdirSync(extractDir);
    expect(extractedContents.length).toBeGreaterThan(0);

    // Debug: Show what was extracted
    console.log('📦 Extracted contents:', extractedContents);

    // Check if package.json exists in the extract directory itself (files extracted directly)
    if (fs.existsSync(path.join(extractDir, 'package.json'))) {
      console.log('📁 Project files extracted directly to:', extractDir);
      return extractDir;
    }

    // Otherwise, look for a project subdirectory
    for (const item of extractedContents) {
      const itemPath = path.join(extractDir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        // Check if this directory contains package.json
        if (fs.existsSync(path.join(itemPath, 'package.json'))) {
          console.log('📁 Found project directory:', item);
          return itemPath;
        }
      }
    }

    throw new Error(
      'Could not find project directory with package.json in extracted contents'
    );
  }

  function verifyProjectStructure(projectPath: string) {
    // Debug: Log what actually exists in the project
    console.log('📁 Project path:', projectPath);
    console.log('📁 Contents:', fs.readdirSync(projectPath));

    if (fs.existsSync(path.join(projectPath, 'src'))) {
      console.log(
        '📁 src contents:',
        fs.readdirSync(path.join(projectPath, 'src'))
      );
    }

    // Verify basic onion architecture structure
    const expectedDirs = [
      'src',
      'src/Domain',
      'src/Application',
      'src/Infrastructure',
    ];

    for (const dir of expectedDirs) {
      const dirPath = path.join(projectPath, dir);
      console.log(
        `🔍 Checking directory: ${dirPath} - exists: ${fs.existsSync(dirPath)}`
      );
      expect(fs.existsSync(dirPath)).toBeTruthy();
      expect(fs.statSync(dirPath).isDirectory()).toBeTruthy();
    }

    // Verify package.json exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBeTruthy();

    // Verify package.json has required scripts
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.dev || packageJson.scripts.start).toBeDefined();
  }

  async function verifyReactProjectStructure(projectPath: string) {
    await verifyProjectStructure(projectPath);

    // Verify React-specific files
    const reactFiles = ['src/main.tsx', 'src/App.tsx', 'vite.config.ts'];

    for (const file of reactFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        expect(fs.statSync(filePath).isFile()).toBeTruthy();
      }
    }
  }

  function verifyLitProject(projectPath: string) {
    verifyProjectStructure(projectPath);

    const packageJsonPath = path.join(projectPath, 'package.json');
    const appPath = path.join(
      projectPath,
      'src/infrastructure/presentation/App.ts'
    );

    expect(fs.existsSync(packageJsonPath)).toBe(true);
    expect(fs.existsSync(appPath)).toBe(true);
    expect(fs.statSync(appPath).isFile()).toBe(true);

    // Verify that the App.ts file contains the expected Lit imports
    const appSource = fs.readFileSync(appPath, 'utf8');
    expect(appSource).toMatch(
      /import\s*\{\s*LitElement\s*,\s*html\s*,\s*css\s*,\s*unsafeCSS\s*\}\s*from\s*['"]lit['"]\s*;/
    );

    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8')
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    // Verify that the package.json has the 'lit' dependency
    expect({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }).toHaveProperty('lit');
  }

  function verifyAngularProjectStructure(projectPath: string) {
    verifyProjectStructure(projectPath);

    // Verify Angular-specific files
    const angularFiles = ['src/main.ts', 'src/app', 'angular.json'];

    for (const file of angularFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        expect(stat.isFile() || stat.isDirectory()).toBeTruthy();
      }
    }
  }

  async function installDependencies(projectPath: string) {
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

  //works for both React and Lit projects
  async function startAndVerifyReactOrLitProject(projectPath: string) {
    await ProjectRunner.startProject(projectPath, 'npm run dev');
  }

  async function startAndVerifyAngularProject(projectPath: string) {
    // Use a non-default port to avoid clashing with the app under test on 4200
    await ProjectRunner.startProject(projectPath, 'ng serve --port 4201');
  }
});
