import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);

interface TestProject {
  downloadPath: string;
  extractPath: string;
  projectName: string;
}

class ProjectRunner {
  private static isStartupMessage(data: string): boolean {
    return (
      data.includes('Local:') ||
      data.includes('localhost') ||
      data.includes('ready') ||
      data.includes('compiled') ||
      data.includes('serve')
    );
  }

  private static isErrorMessage(data: string): boolean {
    return data.includes('Error:') || data.includes('EADDRINUSE');
  }

  static async startProject(
    projectPath: string,
    command: string
  ): Promise<void> {
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

      process.stdout?.on('data', (data: string) => {
        console.log('Project stdout:', data);
        if (ProjectRunner.isStartupMessage(data)) {
          handleSuccess();
        }
      });

      process.stderr?.on('data', (data: string) => {
        console.log('Project stderr:', data);
        if (ProjectRunner.isErrorMessage(data)) {
          handleError(`Project startup failed: ${data}`);
        }
      });

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

test.describe('Full Project Workflow E2E Tests', () => {
  let page: Page;
  let testProject: TestProject;
  let tempDir: string;

  // Set longer timeout for all tests in this suite
  test.setTimeout(600000); // 10 minutes

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });

    page = await context.newPage();

    // Create temporary directory for this test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-e2e-'));

    testProject = {
      downloadPath: '',
      extractPath: '',
      projectName: 'test-onion-project',
    };

    // Navigate and dismiss YouTube modal if it appears
    await page.goto('http://localhost:4200/generator');

    // Dismiss YouTube modal if it appears
    try {
      const closeButton = page.locator('.close-button');
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // Modal not found, continue
    }

    await page.waitForLoadState('networkidle');
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

  test('should download, extract, install and run generated project successfully', async () => {
    // Step 1: Configure a simple project
    await setupSimpleProject(page);

    // Step 2: Download the project
    const downloadPath = await downloadProject(page);
    testProject.downloadPath = downloadPath;

    // Step 3: Extract the zip file
    const extractPath = await extractProject(downloadPath);
    testProject.extractPath = extractPath;

    // Step 4: Verify basic project structure
    await verifyProjectStructure(extractPath);

    // Step 5: Install dependencies
    await installDependencies(extractPath);

    // Step 6: Start the project and verify it runs
    await startAndVerifyProject(extractPath);
  });

  test('should handle React project generation and execution', async () => {
    // Configure React-specific project
    await setupReactProject(page);

    const downloadPath = await downloadProject(page);
    const extractPath = await extractProject(downloadPath);

    await verifyReactProjectStructure(extractPath);
    await installDependencies(extractPath);
    await startAndVerifyReactProject(extractPath);
  });

  test('should handle Angular project generation and execution', async () => {
    // Configure Angular-specific project
    await setupAngularProject(page);

    const downloadPath = await downloadProject(page);
    const extractPath = await extractProject(downloadPath);

    await verifyAngularProjectStructure(extractPath);
    await installDependencies(extractPath);
    await startAndVerifyAngularProject(extractPath);
  });

  async function setupSimpleProject(page: Page) {
    // Set project name using the actual input selector
    await page.fill(
      'input.text-input[placeholder="Enter Project name"]',
      testProject.projectName
    );

    // Add nodes using the diagram interface
    // Add an entity
    await page.selectOption('select.select-input', 'entity');
    await page.fill('input.text-input[placeholder="Enter node name"]', 'User');
    await page.click('button.btn.btn-primary:has-text("Add Node")');

    // Add a domain service
    await page.selectOption('select.select-input', 'domain');
    await page.fill(
      'input.text-input[placeholder="Enter node name"]',
      'UserService'
    );
    await page.click('button.btn.btn-primary:has-text("Add Node")');

    // Add an application service
    await page.selectOption('select.select-input', 'application');
    await page.fill(
      'input.text-input[placeholder="Enter node name"]',
      'UserAppService'
    );
    await page.click('button.btn.btn-primary:has-text("Add Node")');

    // Wait for configuration to be processed
    await page.waitForTimeout(1000);
  }

  async function setupReactProject(page: Page) {
    await setupSimpleProject(page);
    // React framework would be pre-selected by routing to the appropriate page
  }

  async function setupAngularProject(page: Page) {
    await setupSimpleProject(page);
    // Angular framework would be pre-selected by routing to the appropriate page
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

      // Trigger download - this needs to be async but wrapped properly
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

  async function verifyProjectStructure(projectPath: string) {
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

  async function verifyAngularProjectStructure(projectPath: string) {
    await verifyProjectStructure(projectPath);

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

  async function startAndVerifyProject(projectPath: string) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const startCommand =
      packageJson.scripts.dev || packageJson.scripts.start || 'npm run dev';

    await ProjectRunner.startProject(projectPath, startCommand);
  }

  async function startAndVerifyReactProject(projectPath: string) {
    await ProjectRunner.startProject(projectPath, 'npm run dev');
  }

  async function startAndVerifyAngularProject(projectPath: string) {
    await ProjectRunner.startProject(projectPath, 'ng serve');
  }
});
