import { ICommandRunner } from '../../Domain/Interfaces/ICommandRunner';
//import { RunCommandService } from './RunCommandService';

export class NodeCommandRunner implements ICommandRunner {
  constructor(
   // private readonly commandRunnerService: RunCommandService
  ) {}
  async runCommand(command: string, cwd: string): Promise<string> {
    //return await this.commandRunnerService.runCommand(command, cwd);
    return '';
  }

  async installPackages(packages: string[], cwd: string): Promise<void> {
    await this.runCommand(`npm install ${packages.join(' ')}`, cwd);
  }

  async npmInit(cwd: string): Promise<void> {
    await this.runCommand('npm init -y', cwd);
  }

  async runNpmScript(script: string, cwd: string): Promise<void> {
    await this.runCommand(`npm run ${script}`, cwd);
  }

  async createViteProject(
    projectName: string,
    template: string,
    cwd: string
  ): Promise<void> {
    await this.runCommand(
      `npx create-vite@latest ${projectName} --template ${template}`,
      cwd
    );
  }

  async createAngularProject(
    projectName: string,
    cwd: string,
    options: string[] = []
  ): Promise<void> {
    const optionsStr = options.join(' ');
    await this.runCommand(
      `npx @angular/cli@latest new ${projectName} ${optionsStr}`,
      cwd
    );
  }
}
