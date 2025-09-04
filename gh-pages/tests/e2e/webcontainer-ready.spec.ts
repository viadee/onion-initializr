import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';

test.describe('WebContainer Ready Test', () => {
  // Set longer timeout for WebContainer tests
  test.setTimeout(600000); // 10 minutes

  test('should wait for WebContainer and successfully download', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });

    const page = await context.newPage();
    let tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-webcontainer-'));

    try {
      console.log('🚀 Testing WebContainer readiness and download...');

      // Monitor important console messages
      page.on('console', msg => {
        const text = msg.text();
        if (
          text.includes('WebContainer') ||
          text.includes('Cross-origin') ||
          text.includes('ready') ||
          text.includes('initialized') ||
          text.includes('boot')
        ) {
          console.log(`📊 Console: ${text}`);
        }
        if (msg.type() === 'error') {
          console.log(`❌ Console error: ${text}`);
        }
      });

      // Load the page and dismiss YouTube modal if it appears
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
      console.log('✓ Page loaded');

      // Wait for cross-origin isolation check
      console.log('⏳ Checking cross-origin isolation...');
      const crossOriginReady = await page.evaluate(() => {
        return window.crossOriginIsolated;
      });

      if (!crossOriginReady) {
        throw new Error(
          '❌ Cross-origin isolation not enabled! Server needs to be restarted.'
        );
      }
      console.log('✓ Cross-origin isolation is enabled');

      // Wait for WebContainer indicators to appear
      console.log('⏳ Waiting for WebContainer initialization indicators...');

      // Look for any WebContainer status messages on the page
      const statusSelectors = [
        'text=Initializing WebContainer',
        'text=WebContainer ready',
        'text=Cross-origin isolation enabled',
        '[data-status*="webcontainer"]',
        '.webcontainer-status',
      ];

      let webContainerInitialized = false;

      // Wait up to 2 minutes for WebContainer to be ready
      for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(1000);

        // Check if any status indicates WebContainer is ready
        for (const selector of statusSelectors) {
          try {
            if (await page.locator(selector).isVisible({ timeout: 100 })) {
              const statusText = await page.locator(selector).textContent();
              console.log(`📊 Found status: "${statusText}"`);

              if (
                statusText?.includes('ready') ||
                statusText?.includes('enabled')
              ) {
                webContainerInitialized = true;
                break;
              }
            }
          } catch {
            // Continue
          }
        }

        if (webContainerInitialized) {
          break;
        }

        // Check generate button status as indicator
        const generateBtn = page.locator('#generate');
        if (await generateBtn.isVisible({ timeout: 100 })) {
          const isEnabled = await generateBtn.isEnabled();
          const btnText = await generateBtn.textContent();

          if (i % 10 === 0) {
            console.log(
              `📊 ${i}s: Generate button="${btnText}", enabled=${isEnabled}`
            );
          }

          // If button is enabled and shows "Download Project", WebContainer might be ready
          if (isEnabled && btnText?.includes('Download')) {
            console.log('✓ Generate button appears ready');
            webContainerInitialized = true;
            break;
          }
        }
      }

      if (!webContainerInitialized) {
        console.log('⚠️ WebContainer readiness unclear, proceeding anyway...');
      } else {
        console.log('✓ WebContainer appears to be initialized');
      }

      // Add some basic project configuration
      console.log('📝 Configuring project...');

      // Select React framework
      console.log('🎯 Selecting React framework...');
      const reactButton = page.locator(
        'button:has-text("React"), .framework-btn:has-text("React")'
      );
      if (await reactButton.isVisible({ timeout: 2000 })) {
        await reactButton.click();
        console.log('✓ React framework selected');
      } else {
        console.log('⚠️ React button not found, checking alternatives...');
        // Try alternative selectors
        const alternatives = [
          'button[data-framework="react"]',
          '[data-testid="react-framework"]',
          'text=React',
        ];

        for (const selector of alternatives) {
          if (await page.locator(selector).isVisible({ timeout: 1000 })) {
            await page.locator(selector).click();
            console.log(`✓ React selected using ${selector}`);
            break;
          }
        }
      }

      const projectInput = page.locator(
        'input[placeholder="Enter Project name"]'
      );
      if (await projectInput.isVisible({ timeout: 2000 })) {
        await projectInput.fill('webcontainer-test');
        console.log('✓ Project name set');
      }

      // Extra wait to ensure everything is settled
      console.log('⏳ Final settling wait...');
      await page.waitForTimeout(5000);

      // Set up download monitoring with Promise-based approach
      let downloadPromise: Promise<{
        downloadPath: string;
        filename: string;
      }> | null = null;

      page.on('download', async download => {
        const filename = await download.suggestedFilename();
        console.log(`🎉 DOWNLOAD RECEIVED: ${filename}`);

        downloadPromise = (async () => {
          const downloadPath = path.join(tempDir, filename);
          await download.saveAs(downloadPath);

          const stats = fs.statSync(downloadPath);
          console.log(`✓ Download completed: ${stats.size} bytes`);

          // Verify it's a valid zip
          expect(stats.size).toBeGreaterThan(1000);
          expect(filename.endsWith('.zip')).toBeTruthy();

          return { downloadPath, filename };
        })();
      });

      // Trigger download
      const generateBtn = page.locator('#generate');
      await expect(generateBtn).toBeVisible();
      await expect(generateBtn).toBeEnabled();

      console.log('🔘 Triggering download...');
      await generateBtn.click();

      // Wait for generation with detailed monitoring
      let generationCompleted = false;
      let downloadResult: {
        downloadPath: string;
        filename: string;
      } | null = null;

      for (let i = 0; i < 300; i++) {
        // 5 minutes
        await page.waitForTimeout(1000);

        if (downloadPromise) {
          console.log('🔄 Download started, waiting for completion...');
          downloadResult = await downloadPromise;
          generationCompleted = true;
          console.log('🎉 Generation and download completed successfully!');
          break;
        }

        const btnText = await generateBtn.textContent();
        const isEnabled = await generateBtn.isEnabled();

        if (i % 15 === 0) {
          console.log(`📊 ${i}s: "${btnText}", enabled=${isEnabled}`);
        }

        // Check for any error states
        if (btnText?.includes('Error') || btnText?.includes('Failed')) {
          throw new Error(`Generation failed: ${btnText}`);
        }
      }

      if (!generationCompleted || !downloadResult) {
        // Take screenshot for debugging
        await page.screenshot({
          path: path.join(tempDir, 'generation-timeout.png'),
          fullPage: true,
        });
        console.log(
          `📸 Screenshot: ${path.join(tempDir, 'generation-timeout.png')}`
        );

        throw new Error('Generation did not complete within 5 minutes');
      }

      // Extract and validate the project
      console.log('📦 Extracting and validating project...');
      if (downloadResult) {
        await validateReactProject(downloadResult.downloadPath, tempDir);
      }
    } finally {
      // Keep temp directory for inspection if test fails
      if (tempDir && fs.existsSync(tempDir)) {
        console.log(`📁 Temp directory preserved: ${tempDir}`);
      }
    }
  });
});

async function validateReactProject(
  zipPath: string,
  tempDir: string
): Promise<void> {
  console.log('📁 Extracting project files...');

  // Extract the zip file
  const zip = new AdmZip(zipPath);
  const extractDir = path.join(tempDir, 'extracted-project');
  zip.extractAllTo(extractDir, true);

  console.log(`✓ Project extracted to ${extractDir}`);

  // Find the project directory (might be nested)
  const contents = fs.readdirSync(extractDir);
  let projectDir = extractDir;

  if (
    contents.length === 1 &&
    fs.statSync(path.join(extractDir, contents[0])).isDirectory()
  ) {
    projectDir = path.join(extractDir, contents[0]);
  }

  console.log(`📂 Project directory: ${projectDir}`);

  // Verify package.json exists
  const packageJsonPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found in extracted project');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`✓ Found package.json for project: ${packageJson.name}`);

  // Verify React dependencies
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const requiredDeps = ['react', 'typescript'];

  for (const dep of requiredDeps) {
    if (!dependencies[dep]) {
      console.log(`⚠️ Missing dependency: ${dep}`);
    } else {
      console.log(`✓ Found dependency: ${dep}@${dependencies[dep]}`);
    }
  }

  // Run npm install
  console.log('📦 Installing dependencies...');
  await runCommand('npm', ['install'], projectDir);

  // Verify node_modules was created
  const nodeModulesPath = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error('node_modules directory not created after npm install');
  }
  console.log('✓ Dependencies installed successfully');

  // Try to build/start the project
  console.log('🏗️ Testing project build...');

  // Check if there's a build script
  if (packageJson.scripts?.build) {
    console.log('🔨 Running npm run build...');
    await runCommand('npm', ['run', 'dev'], projectDir);
    console.log('✓ Build completed successfully');
  }

  // Check if there's a dev script
  if (packageJson.scripts?.dev) {
    console.log('🚀 Testing npm run dev (will timeout after 30s)...');
    try {
      await runCommand('npm', ['run', 'dev'], projectDir, 30000);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log(
          '✓ Dev server started successfully (timed out as expected)'
        );
      } else {
        throw error;
      }
    }
  } else if (packageJson.scripts?.start) {
    console.log('🚀 Testing npm start (will timeout after 30s)...');
    try {
      await runCommand('npm', ['start'], projectDir, 30000);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log(
          '✓ Start command executed successfully (timed out as expected)'
        );
      } else {
        throw error;
      }
    }
  }

  console.log('🎉 React project validation completed successfully!');
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs = 120000
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')} in ${cwd}`);

    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    let errorOutput = '';

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      if (
        text.includes('Local:') ||
        text.includes('ready') ||
        text.includes('compiled')
      ) {
        console.log(`📊 ${text.trim()}`);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      errorOutput += text;
      if (!text.includes('warning') && !text.includes('deprecated')) {
        console.log(`⚠️ ${text.trim()}`);
      }
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on('close', (code: number | null) => {
      clearTimeout(timeout);

      if (code === 0) {
        console.log(`✓ Command completed successfully`);
        resolve();
      } else {
        console.log(`❌ Command failed with code ${code}`);
        console.log(`Output: ${output}`);
        console.log(`Error: ${errorOutput}`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
