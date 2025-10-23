import chalk from 'chalk';
import ora from 'ora';
export class RunCommandService {
  async runCommand(command: string, cwd: string): Promise<string> {
    console.log(`Executing command: ${command} in ${cwd}`);
    const { exec } = (await import(
      'node:child_process'
    )) as typeof import('child_process');
    const spinner = ora({
      text: `Running: ${command}`,
      spinner: 'dots',
    }).start();

    return new Promise((resolve, reject) => {
      const process = exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          spinner.fail(chalk.red(`Command failed: ${error.message}`));
          return reject(error);
        }

        if (stderr) {
          console.warn(chalk.yellow(`stderr: ${stderr}`));
        }

        spinner.succeed(chalk.green(`${command} completed`));
        resolve(stdout);
      });

      process.stderr?.on('data', data => {
        console.warn(chalk.yellow(data.toString()));
      });
    });
  }
}
