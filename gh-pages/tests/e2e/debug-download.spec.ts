import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';

test.describe('Debug Website Download', () => {
  test.setTimeout(600000); // 10 minutes
  let page: Page;
  let tempDir: string;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });

    page = await context.newPage();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-debug-'));
    console.log(`Using temp directory: ${tempDir}`);

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
    await page.waitForTimeout(3000);
  });

  test.afterEach(async () => {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('🧹 Cleaned up temp directory');
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp directory:', cleanupError);
      }
    }
  });

  test('should debug the generate button and download', async () => {
    console.log('🔍 Debug mode: Investigating the download button...');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-before-click.png', fullPage: true });

    // Check if the generate button exists and is visible
    const generateButton = page.locator('#generate');
    const isVisible = await generateButton.isVisible();
    const isEnabled = await generateButton.isEnabled();

    console.log(`🔘 Generate button visible: ${isVisible}`);
    console.log(`🔘 Generate button enabled: ${isEnabled}`);

    if (isVisible) {
      const buttonText = await generateButton.textContent();
      console.log(`🔘 Button text: "${buttonText}"`);

      const buttonClasses = await generateButton.getAttribute('class');
      console.log(`🔘 Button classes: "${buttonClasses}"`);
    }

    // Check if we need to wait for anything to load
    await page.waitForTimeout(2000);

    // Try clicking the button and see what happens
    if (isVisible && isEnabled) {
      console.log('🔘 Attempting to click the generate button...');

      // Set up download listener BEFORE clicking
      const downloadPromise = page.waitForEvent('download');

      await generateButton.click();
      console.log('🔘 Generate button clicked!');

      // Take screenshot after click
      await page.screenshot({ path: 'debug-after-click.png', fullPage: true });

      try {
        // Wait for download to start
        const download = await downloadPromise;
        console.log('📥 Download started!');

        const filename = await download.suggestedFilename();
        const downloadPath = path.join(tempDir, filename);

        console.log(`📥 Downloading file: ${filename}`);
        await download.saveAs(downloadPath);

        // Verify download
        if (fs.existsSync(downloadPath)) {
          const stats = fs.statSync(downloadPath);
          console.log(
            `✅ Download successful: ${downloadPath} (${stats.size} bytes)`
          );

          // Try to extract and peek at contents
          if (stats.size > 0) {
            try {
              const zip = new AdmZip(downloadPath);
              const entries = zip.getEntries();
              console.log(`📂 ZIP contains ${entries.length} entries:`);
              entries.slice(0, 10).forEach(entry => {
                console.log(`  - ${entry.entryName}`);
              });
            } catch (zipError) {
              console.log('⚠️ Could not extract ZIP:', zipError.message);
            }
          }
        } else {
          console.log('❌ Download file not found');
        }
      } catch (downloadError) {
        console.log('❌ Download failed or timed out:', downloadError.message);

        // Check if there are any progress modals or error messages
        const progressModal = page.locator('.progress-modal');
        if (await progressModal.isVisible({ timeout: 1000 })) {
          const modalText = await progressModal.textContent();
          console.log('📋 Modal content:', modalText);
        }

        // Check if button text changed (e.g., to "Generating...")
        const newButtonText = await generateButton.textContent();
        console.log(`🔘 Button text after click: "${newButtonText}"`);
      }
    } else {
      console.log('❌ Generate button not clickable');

      // Try to find all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log(`🔍 Found ${allButtons.length} buttons on page:`);

      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const button = allButtons[i];
        const text = await button.textContent();
        const id = await button.getAttribute('id');
        const classes = await button.getAttribute('class');
        const isButtonVisible = await button.isVisible();
        const isButtonEnabled = await button.isEnabled();

        console.log(
          `  ${i}: "${text}" id="${id}" classes="${classes}" visible=${isButtonVisible} enabled=${isButtonEnabled}`
        );
      }
    }

    // Wait a bit more and check for any dynamic content
    await page.waitForTimeout(5000);

    // Final screenshot
    await page.screenshot({ path: 'debug-final.png', fullPage: true });

    console.log('🔍 Debug investigation complete');
  });
});
