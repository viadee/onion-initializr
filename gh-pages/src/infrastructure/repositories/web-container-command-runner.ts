import { WebContainer } from '@webcontainer/api';
import { ICommandRunner } from '../../../../lib/domain/interfaces/icommand-runner';

/**
 * WebContainer-compatible command runner that replaces the Node.js child_process based runCommand
 */
export class WebContainerCommandRunner implements ICommandRunner {
  constructor(private readonly webcontainer: WebContainer) {}

  /**
   * Run a command in the WebContainer environment
   * @param command - The command to run (e.g., "npm install", "npm run build")
   * @param cwd - Working directory (default: root)
   * @returns Promise that resolves when command completes
   */
  async runCommand(command: string, cwd: string = '/'): Promise<void> {
    const normalizedCwd = cwd.replace(/\\/g, '/');

    // Parse command and arguments
    const [cmd, ...args] = command.split(' ');

    try {
      console.log(`Running command: ${command} in ${normalizedCwd}`);

      const spawnedProcess = await this.webcontainer.spawn(cmd, args, {
        cwd: normalizedCwd,
        // Add environment variables to avoid interactive prompts
        env: {
          CI: 'true', // Many tools skip prompts in CI environment
          FORCE_COLOR: '0', // Disable colored output
        },
      });

      // Capture output
      let output = '';

      // Listen to output
      spawnedProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            output += data;
            console.log(data);
          },
        })
      );

      const exitCode = await spawnedProcess.exit;

      if (exitCode !== 0) {
        console.error(`Command output: ${output}`);
        console.error(
          `Working directory contents:`,
          await this.webcontainer.fs
            .readdir(normalizedCwd)
            .catch(() => 'Could not read directory')
        );

        // Try to read npm log file if it's an npm error
        if (
          cmd === 'npm' &&
          output.includes('A complete log of this run can be found in:')
        ) {
          const logMatch = RegExp(
            /A complete log of this run can be found in: (.+)/
          ).exec(output);
          if (logMatch) {
            const logPath = logMatch[1];
            try {
              const logContent = await this.webcontainer.fs.readFile(
                logPath,
                'utf-8'
              );
              console.error(`NPM Error Log Content:`, logContent);
            } catch (logError) {
              console.warn(`Could not read npm log file ${logPath}:`, logError);
            }
          }
        }

        throw new Error(
          `Command "${command}" failed with exit code ${exitCode}. Output: ${output}`
        );
      }

      console.log(`Command "${command}" completed successfully`);
    } catch (error) {
      console.error(`Failed to run command "${command}":`, error);
      throw error;
    }
  }

  /**
   * Install npm packages
   */
  async installPackages(packages: string[], cwd: string = '/'): Promise<void> {
    console.log(`Installing packages: ${packages.join(', ')}`);
    const startTime = Date.now();
    await this.runCommand(`npm install ${packages.join(' ')}`, cwd);
    const endTime = Date.now();
    console.log(`Packages installed successfully in ${endTime - startTime}ms`);
  }

  /**
   * Initialize npm project
   */
  async npmInit(cwd: string = '/'): Promise<void> {
    await this.runCommand('npm init -y', cwd);
  }

  /**
   * Run npm scripts
   */
  async runNpmScript(script: string, cwd: string = '/'): Promise<void> {
    await this.runCommand(`npm run ${script}`, cwd);
  }

  /**
   * Create Vite projects (equivalent to npx create-vite)
   */
  async createViteProject(
    projectName: string,
    template: string,
    cwd: string = '/'
  ): Promise<void> {
    // --no-interactive: Force non-interactive mode
    await this.runCommand(
      `npx --yes create-vite@latest ${projectName} --template ${template} --no-interactive`,
      cwd
    );
  }

  /**
   * Create Angular projects
   */
  async createAngularProject(
    projectName: string,
    cwd: string = '/',
    options: string[] = []
  ): Promise<void> {
    const optionsStr = options.join(' ');

    // Create a safe temp directory outside of the current workspace
    const safeTempDir = '/tmp/angular-gen';
    await this.webcontainer.fs.mkdir(safeTempDir, { recursive: true });

    // Run ng new in the safe temp directory
    await this.runCommand(
      `npx @angular/cli@latest new ${projectName} ${optionsStr}`,
      safeTempDir
    );

    // Move the created project to the target directory
    const createdProjectPath = `${safeTempDir}/${projectName}`;
    const targetPath = `${cwd}/${projectName}`;

    // Ensure target directory exists
    await this.webcontainer.fs.mkdir(cwd, { recursive: true });

    // Copy the project files from temp to target
    await this.copyDirectory(createdProjectPath, targetPath);

    // Clean up temp directory
    await this.webcontainer.fs.rm(safeTempDir, {
      recursive: true,
      force: true,
    });
  }

  /**
   * Helper method to copy directory contents
   */
  private async copyDirectory(source: string, target: string): Promise<void> {
    await this.webcontainer.fs.mkdir(target, { recursive: true });

    const entries = await this.webcontainer.fs.readdir(source, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const sourcePath = `${source}/${entry.name}`;
      const targetPath = `${target}/${entry.name}`;

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        const content = await this.webcontainer.fs.readFile(sourcePath);
        await this.webcontainer.fs.writeFile(targetPath, content);
      }
    }
  }
}
