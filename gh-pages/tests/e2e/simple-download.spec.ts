import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

test.describe('Simple Download Test', () => {
  test.setTimeout(600000); // 10 minutes
  test('should wait longer and check console for errors', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      acceptDownloads: true,
    });

    const page = await context.newPage();
    let tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onion-simple-'));

    try {
      console.log('🔍 Simple download test starting...');

      // Monitor console messages
      page.on('console', msg => {
        if (
          msg.type() === 'error' ||
          msg.text().includes('error') ||
          msg.text().includes('Error')
        ) {
          console.log(`❌ Console error: ${msg.text()}`);
        } else if (
          msg.text().includes('WebContainer') ||
          msg.text().includes('download') ||
          msg.text().includes('generate')
        ) {
          console.log(`📊 Console: ${msg.text()}`);
        }
      });

      // Go to the site and dismiss YouTube modal if it appears
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

      console.log('⏳ Waiting for full site initialization...');
      await page.waitForTimeout(10000); // Wait 10 seconds for WebContainer

      // Fill project name
      const projectInput = page.locator(
        'input[placeholder="Enter Project name"]'
      );
      if (await projectInput.isVisible({ timeout: 5000 })) {
        await projectInput.fill('simple-test');
        console.log('✓ Project name filled');
      }

      // Set up download monitoring
      let downloadReceived = false;
      page.on('download', async download => {
        downloadReceived = true;
        console.log(
          `🎉 DOWNLOAD RECEIVED: ${await download.suggestedFilename()}`
        );

        const downloadPath = path.join(
          tempDir,
          await download.suggestedFilename()
        );
        await download.saveAs(downloadPath);
        console.log(`✓ Download saved to: ${downloadPath}`);

        const stats = fs.statSync(downloadPath);
        console.log(`✓ File size: ${stats.size} bytes`);
      });

      // Click generate and wait much longer
      const generateBtn = page.locator('#generate');
      console.log('🔘 Clicking generate button...');
      await generateBtn.click();

      // Wait up to 3 minutes for download
      console.log('⏳ Waiting up to 3 minutes for download...');
      for (let i = 0; i < 180; i++) {
        await page.waitForTimeout(1000);

        if (downloadReceived) {
          console.log('🎉 SUCCESS: Download received!');
          break;
        }

        if (i % 10 === 0) {
          const btnText = await generateBtn.textContent();
          const isEnabled = await generateBtn.isEnabled();
          console.log(`📊 ${i}s: Button="${btnText}", enabled=${isEnabled}`);
        }
      }

      if (!downloadReceived) {
        console.log('❌ No download received after 3 minutes');

        // Take final screenshot
        await page.screenshot({
          path: path.join(tempDir, 'final-state.png'),
          fullPage: true,
        });
        console.log(
          `📸 Final screenshot: ${path.join(tempDir, 'final-state.png')}`
        );
      }
    } finally {
      // Cleanup
      if (tempDir && fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (error) {
          console.warn('Failed to cleanup:', error);
        }
      }
    }
  });
});
