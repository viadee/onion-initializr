import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { OnionConfig } from '../../src/Domain/Entities/OnionConfig';

interface DownloadWatcher {
  downloadPath: string | null;
  content: OnionConfig | null;
}

test.describe('Download JSON Functionality', () => {
  test.setTimeout(600000); // 10 minutes
  let page: Page;
  let downloadWatcher: DownloadWatcher;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });

    page = await context.newPage();
    downloadWatcher = { downloadPath: null, content: null };

    // Set up download handler
    page.on('download', async download => {
      try {
        const downloadPath = path.join(
          './tests/e2e/downloads',
          await download.suggestedFilename()
        );
        await download.saveAs(downloadPath);
        downloadWatcher.downloadPath = downloadPath;

        // Read and parse the downloaded JSON
        const fileContent = fs.readFileSync(downloadPath, 'utf-8');
        downloadWatcher.content = JSON.parse(fileContent);
      } catch (error) {
        console.error('Download handling error:', error);
        throw error;
      }
    });

    await page.goto('http://localhost:4200/generator');

    // Dismiss YouTube modal if it appears
    const closeButton = page.locator('.close-button');
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }

    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Clean up downloaded files
    if (
      downloadWatcher.downloadPath &&
      fs.existsSync(downloadWatcher.downloadPath)
    ) {
      fs.unlinkSync(downloadWatcher.downloadPath);
    }
    await page.close();
  });

  test('should download JSON with correct project name and entity structure', async () => {
    // Define test data
    const testProjectName = 'TestOnionProject';

    // Step 1: Wait for app to load
    await page.waitForSelector('.diagram-container', { timeout: 15000 });

    // Step 2: Set project name if input is available
    const projectNameInput = page.locator(
      'input[placeholder="Enter Project name"]'
    );
    if (await projectNameInput.isVisible()) {
      await projectNameInput.fill(testProjectName);
    }

    // Step 3: Wait for the data summary or entities to be visible
    await page.waitForSelector(
      '.data-summary, .summary-grid, svg circle, svg rect',
      {
        timeout: 15000,
      }
    );

    // Step 4: Find and click the Download JSON button
    const downloadButton = page.locator(
      '#jsonDownload, button:has-text("Download JSON")'
    );
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();

    // Step 5: Wait for download to complete
    await page.waitForTimeout(3000);
    expect(downloadWatcher.downloadPath).toBeTruthy();
    expect(downloadWatcher.content).toBeTruthy();

    // Step 6: Validate the downloaded JSON structure
    const downloadedData = downloadWatcher.content!;

    // Verify project name is in folderPath (if it was set)
    const wasProjectNameSet = await page
      .locator('input[placeholder="Enter Project name"]')
      .isVisible();
    if (wasProjectNameSet) {
      expect(downloadedData.folderPath).toContain(testProjectName);
    }

    // Verify entities array exists and contains expected data
    expect(Array.isArray(downloadedData.entities)).toBe(true);
    expect(downloadedData.entities.length).toBeGreaterThan(0);

    // Verify domain services array exists
    expect(Array.isArray(downloadedData.domainServices)).toBe(true);

    // Verify application services array exists
    expect(Array.isArray(downloadedData.applicationServices)).toBe(true);

    // Verify domain service connections object exists
    expect(typeof downloadedData.domainServiceConnections).toBe('object');
    expect(downloadedData.domainServiceConnections).not.toBeNull();

    // Verify application service dependencies object exists
    expect(typeof downloadedData.applicationServiceDependencies).toBe('object');
    expect(downloadedData.applicationServiceDependencies).not.toBeNull();

    // Verify framework configurations
    expect(downloadedData.diFramework).toBeDefined();
    expect(['awilix', 'angular']).toContain(downloadedData.diFramework);
  });

  test('should download JSON with initial entities from startup data', async () => {
    // This test verifies that the initial entities are correctly included in the download

    // Step 1: Wait for page to load with initial data
    await page.waitForSelector('.diagram-container', { timeout: 15000 });

    // Step 2: Wait for data to be available
    await page.waitForSelector('.data-summary, .summary-grid, #jsonDownload', {
      timeout: 15000,
    });

    // Step 3: Download JSON directly
    const downloadButton = page.locator(
      '#jsonDownload, button:has-text("Download JSON")'
    );
    await downloadButton.click();

    // Step 4: Wait for download
    await page.waitForTimeout(3000);
    expect(downloadWatcher.content).toBeTruthy();

    const downloadedData = downloadWatcher.content!;

    // Step 5: Verify downloaded entities match what's displayed
    expect(downloadedData.entities.length).toBeGreaterThanOrEqual(1);

    // Verify that common test entities are present (from onionData.json)
    const expectedEntities = ['User', 'Order', 'Product'];
    const hasExpectedEntities = expectedEntities.some(entity =>
      downloadedData.entities.includes(entity)
    );
    expect(hasExpectedEntities).toBe(true);

    // Verify domain services are properly structured
    expect(downloadedData.domainServices.length).toBeGreaterThan(0);

    // Verify that domain service connections reference valid entities
    for (const [serviceName, connectedEntities] of Object.entries(
      downloadedData.domainServiceConnections
    )) {
      expect(downloadedData.domainServices).toContain(serviceName);

      for (const entity of connectedEntities) {
        expect(downloadedData.entities).toContain(entity);
      }
    }

    // Verify application service dependencies structure
    for (const [appService, dependencies] of Object.entries(
      downloadedData.applicationServiceDependencies
    )) {
      expect(downloadedData.applicationServices).toContain(appService);
      expect(Array.isArray(dependencies.domainServices)).toBe(true);
      expect(Array.isArray(dependencies.repositories)).toBe(true);

      // Verify referenced domain services exist
      for (const domainService of dependencies.domainServices) {
        expect(downloadedData.domainServices).toContain(domainService);
      }
    }
  });

  test('should maintain consistent data structure across multiple downloads', async () => {
    // This test ensures that multiple downloads produce consistent results

    await page.waitForSelector(
      '#jsonDownload, button:has-text("Download JSON")',
      {
        timeout: 15000,
      }
    );

    // First download
    const downloadButton = page.locator(
      '#jsonDownload, button:has-text("Download JSON")'
    );
    await downloadButton.click();
    await page.waitForTimeout(2000);

    const firstDownload = downloadWatcher.content;
    expect(firstDownload).toBeTruthy();

    // Reset watcher for second download
    downloadWatcher.content = null;
    downloadWatcher.downloadPath = null;

    // Second download
    await downloadButton.click();
    await page.waitForTimeout(2000);

    const secondDownload = downloadWatcher.content;
    expect(secondDownload).toBeTruthy();

    // Compare the two downloads
    expect(JSON.stringify(firstDownload)).toBe(JSON.stringify(secondDownload));
  });

  test('should include valid UI framework configuration in download', async () => {
    await page.waitForSelector(
      '#jsonDownload, button:has-text("Download JSON")',
      { timeout: 15000 }
    );

    // Select a UI framework if available
    const frameworkSelector = page.locator(
      'select:has(option:text-matches("react|vue|angular|lit", "i")), [data-testid="ui-framework-select"]'
    );
    if (await frameworkSelector.isVisible()) {
      await frameworkSelector.selectOption({ index: 1 }); // Select first non-default option
      await page.waitForTimeout(500);
    }

    // Download JSON
    const downloadButton = page.locator(
      '#jsonDownload, button:has-text("Download JSON")'
    );
    await downloadButton.click();
    await page.waitForTimeout(3000);

    expect(downloadWatcher.content).toBeTruthy();
    const downloadedData = downloadWatcher.content!;

    // Verify UI framework is set (if selector was available and used)
    if (await frameworkSelector.isVisible()) {
      expect(downloadedData.uiFramework).toBeDefined();
      expect(['react', 'vue', 'angular', 'lit', 'vanilla']).toContain(
        downloadedData.uiFramework
      );
    }
  });
});
