import chalk from "chalk";
import { FileService } from "../../../../lib/Domain/Services/FileService";
import { OnionConfig } from "../../../../gh-pages/src/Domain/Entities/OnionConfig";

type InquirerPromptOptions = {
  type: "input" | "list" | "checkbox" | "confirm";
  name: string;
  message: string;
  default?: string | string[];
  choices?: string[];
};

export class FileHelperAppService {
  private static readonly CONFIG_ARG = "--config";

  constructor(private readonly fileService: FileService) {}

  async getConfigData(): Promise<OnionConfig> {
    const configFilePath = this.getConfigFilePath();

    if (!configFilePath) {
      return OnionConfig.empty();
    }

    const result = await this.readJsonFile(configFilePath);

    if (result.data) {
      console.log(chalk.green(`Using configuration from ${configFilePath}`));
      return new OnionConfig(result.data);
    }

    console.log(
      chalk.yellow(
        `Failed to parse config file "${configFilePath}". Falling back to prompts.`
      )
    );
    return OnionConfig.empty();
  }

  getConfigFilePath(): string | undefined {
    const configArgIndex = process.argv.indexOf(
      FileHelperAppService.CONFIG_ARG
    );
    const hasConfigArg = configArgIndex !== -1;
    const hasConfigValue = process.argv[configArgIndex + 1];

    return hasConfigArg && hasConfigValue
      ? process.argv[configArgIndex + 1]
      : undefined;
  }

  /**
   * Safely read and parse a JSON file. Returns undefined if the file doesn’t exist or parse fails.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async readJsonFile(filePath: string): Promise<{ data?: any; error?: Error }> {
    try {
      if (!(await this.fileService.dirExists(filePath))) {
        return { error: new Error("File does not exist.") };
      }
      const jsonFile = await this.fileService.readFile(filePath);
      const parsed = JSON.parse(jsonFile.content);
      return { data: parsed };
    } catch (err) {
      return { error: err as Error };
    }
  }

  /**
   * Get a string value from config or prompt user
   */
  private async getOrPromptString(
    config: OnionConfig,
    key: keyof OnionConfig,
    promptOptions: InquirerPromptOptions
  ): Promise<string> {
    const valFromConfig = config[key];

    const shouldPrompt =
      valFromConfig === undefined ||
      valFromConfig === null ||
      (typeof valFromConfig === "string" && valFromConfig.trim() === "") ||
      (Array.isArray(valFromConfig) && valFromConfig.length === 0);

    if (!shouldPrompt && typeof valFromConfig === "string") {
      return valFromConfig;
    }

    const inquirer =
      (await import("inquirer")).default ?? (await import("inquirer"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const answers = await inquirer.prompt([promptOptions as any]);
    return answers[promptOptions.name] as string;
  }

  /**
   * Get a string array value from config or prompt user, with transformation
   */
  private async getOrPromptStringArray(
    config: OnionConfig,
    key: keyof OnionConfig,
    promptOptions: InquirerPromptOptions
  ): Promise<string[]> {
    const valFromConfig = config[key];

    const shouldPrompt =
      valFromConfig === undefined ||
      valFromConfig === null ||
      (Array.isArray(valFromConfig) && valFromConfig.length === 0);

    if (!shouldPrompt && Array.isArray(valFromConfig)) {
      return valFromConfig;
    }

    const inquirer =
      (await import("inquirer")).default ?? (await import("inquirer"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const answers = await inquirer.prompt([promptOptions as any]);
    const stringValue = answers[promptOptions.name] as string;
    return this.stringToArray(stringValue);
  }

  async getFolderPath(
    config: OnionConfig,
    currentDir: string
  ): Promise<string> {
    return this.getOrPromptString(config, "folderPath", {
      type: "input",
      name: "folderPath",
      message: "Enter path to your project folder:",
      default: currentDir,
    });
  }

  async getEntityNames(config: OnionConfig): Promise<string[]> {
    return this.getOrPromptStringArray(config, "entities", {
      type: "input",
      name: "entities",
      message: "Enter entity names (comma-separated)",
      default: "User, Order",
    });
  }

  async getDomainServiceNames(config: OnionConfig): Promise<string[]> {
    return this.getOrPromptStringArray(config, "domainServices", {
      type: "input",
      name: "domainServices",
      message: "Enter domain service names (comma-separated)",
      default: "UserService, OrderService",
    });
  }

  async getApplicationServiceNames(config: OnionConfig): Promise<string[]> {
    return this.getOrPromptStringArray(config, "applicationServices", {
      type: "input",
      name: "applicationServices",
      message: "Enter application service names (comma-separated)",
      default: "UserAppService",
    });
  }

  private stringToArray(value: string | string[]): string[] {
    return Array.isArray(value)
      ? value
      : value.split(",").map((s: string) => s.trim());
  }
}
