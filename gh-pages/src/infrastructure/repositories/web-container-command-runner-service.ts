import { ICommandRunner } from '@onion-initializr/lib/domain/interfaces/icommand-runner';
import { WebContainerCommandRunner } from './web-container-command-runner';
import { IWebContainerRepository } from '../interfaces/iweb-container-repository';

/**
 * A wrapper service that initializes WebContainerCommandRunner with the WebContainer instance
 * from a WebContainer-capable repository, following Interface Segregation Principle
 */
export class WebContainerCommandRunnerService implements ICommandRunner {
  private commandRunner: WebContainerCommandRunner | null = null;

  constructor(
    private readonly webContainerRepository: IWebContainerRepository
  ) {}

  private async ensureCommandRunner(): Promise<WebContainerCommandRunner> {
    if (!this.commandRunner) {
      const webcontainer = await this.webContainerRepository.getWebContainer();
      this.commandRunner = new WebContainerCommandRunner(webcontainer);
    }
    redsadsaturn this.commandRunner;
  }

  async runCommand(command: string, cwd: string): Promise<void> {
    const runner = await this.ensureCommandRunner();
    return runner.runCommand(command, cwd);
  }

  async installPackages(packages: string[], cwd: string): Promise<void> {
    const runner = await this.ensureCommandRunner();
    return runner.installPackages(packages, cwd);
  }

  async npmInit(cwd: string): Promise<void> {
    const runner = await this.ensureCommandRunner();
    return runner.npmInit(cwd);
  }

  async runNpmScript(script: string, cwd: string): Promise<void> {
    const runner = await this.ensureCommandRunner();
    return runner.runNpmScript(script, cwd);
  }

  async createViteProject(
    projectName: string,
    template: string,
    cwd: string
  ): Promise<void> {
    const runner = await this.ensureCommandRunner();
    return runner.createViteProject(projectName, template, cwd);
  }

  async createAngularProject(
    projectName: string,
    cwd: string,
    options?: string[]
  ): Promise<void> {
    const runner = await this.ensureCommandRunner();
    return runner.createAngularProject(projectName, cwd, options);
  }
}
