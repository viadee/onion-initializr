import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { routes } from './app.routes';

// Dynamically set base href based on hostname
function getBaseHref(): string {
  if (globalThis.window) {
    const hostname = globalThis.window.location.hostname;
    // Check if deployed on GitHub Pages
    if (hostname.includes('github.io')) {
      return '/onion-initializr/';
    }
  }
  // Default for local/Firebase deployment
  return '/';
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_BASE_HREF, useValue: getBaseHref() },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  ],
};
