#!/usr/bin/env node
/**
 * Onion CLI – bootstrap
 *
 * This file is the only thing Node.js runs when the user types `onion`.
 * It just spins up the Awilix container, resolves the high-level service,
 * and lets the service handle all the real work.
 */

// ───────────────────────────────────────────────────────────────────────────────
// Resolve and run

import { container } from '../../Infrastructure/Configuration/awilix.config';
import { OnionCliAppService } from './OnionCliAppService';

// ───────────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const cli = container.resolve<OnionCliAppService>('onionCliAppService');
    await cli.runOnionCli();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
