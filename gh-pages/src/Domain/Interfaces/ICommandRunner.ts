export interface ICommandRunner {
  runCommand(command: string, cwd: string): Promise<string | void>;
  installPackages?(packages: string[], cwd: string): Promise<void>;
  npmInit?(cwd: string): Promise<void>;
  runNpmScript?(script: string, cwd: string): Promise<void>;
  createViteProject?(
    projectName: string,
    template: string,
    cwd: string
  ): Promise<void>;
  createAngularProject?(
    projectName: string,
    cwd: string,
    options?: string[]
  ): Promise<void>;
}
