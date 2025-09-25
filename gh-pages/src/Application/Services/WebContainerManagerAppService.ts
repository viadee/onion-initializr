import { WebContainer } from '@webcontainer/api';

/**
 * Manages WebContainer lifecycle (initialization, reset, status)
 */
export class WebContainerManagerAppService {
  private webcontainer: WebContainer | null = null;
  private isInitialized = false;

  async initialize(): Promise<WebContainer> {
    if (this.webcontainer && this.isInitialized) {
      return this.webcontainer;
    }

    // this.validateEnvironment();

    console.log('Cross-origin isolation enabled, initializing WebContainer...');
    this.webcontainer = await WebContainer.boot();
    this.isInitialized = true;

    console.log('WebContainer initialized successfully');
    return this.webcontainer;
  }

  async reset(): Promise<void> {
    console.log('Resetting WebContainer...');

    if (this.webcontainer) {
      // Reset will be handled by the file repository
      this.webcontainer = null;
      this.isInitialized = false;
    }

    console.log(
      'WebContainer reset completed. You may need to refresh the page.'
    );
  }

  isReady(): boolean {
    return this.isInitialized && this.webcontainer !== null;
  }

  getWebContainer(): WebContainer | null {
    return this.webcontainer;
  }

  private validateEnvironment(): void {
    if (!window.crossOriginIsolated) {
      throw new Error(
        'WebContainer requires cross-origin isolation. Please restart the development server and try again.'
      );
    }
  }
}
