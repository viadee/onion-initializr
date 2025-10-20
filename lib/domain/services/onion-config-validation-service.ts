import { DiFramework, isValidDiFramework, VALID_DI_FRAMEWORKS } from "../entities/di-framework";
import { FileEntity } from "../entities/file-entity";
import { OnionConfig } from "../entities/onion-config";
import { UIFrameworks, isValidUiFramework, VALID_UI_FRAMEWORKS } from "../entities/ui-framework";
import { OnionConfigService } from "./onion-config-service";


export class OnionConfigValidationService {
  constructor(private readonly onionConfigService: OnionConfigService) {}

  async isUserConfigValid(file: FileEntity): Promise<boolean> {
    const onionConfig = this.onionConfigService.mapFileToConfig(file);
    const validation = this.validateConfigStructure(onionConfig);
    if (!validation.valid) {
      validation.errors.forEach((err: string) => {
        throw new Error(err);
      });
      return false;
    }

    return true;
  }

  validateConfigStructure(config: OnionConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const entitySet = new Set(config.entities || []);
    const domainServiceSet = new Set(config.domainServices || []);
    const applicationServiceSet = new Set(config.applicationServices || []);
    const uiFramework = config.uiFramework;
    const diFramework = config.diFramework;

    this.validateDomainServices(config, entitySet, domainServiceSet, errors);
    this.validateApplicationServices(
      config,
      domainServiceSet,
      applicationServiceSet,
      entitySet,
      errors
    );
    this.validateUiFramework(uiFramework, errors);
    this.validateDiFramework(diFramework, errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateDomainServices(
    config: OnionConfig,
    entitySet: Set<string>,
    domainServiceSet: Set<string>,
    errors: string[]
  ): void {
    if (!Array.isArray(config.domainServices)) {
      errors.push("`domainServices` should be an array.");
      return;
    }

    for (const service of config.domainServices) {
      const deps = config.domainServiceConnections?.[service];
      if (!Array.isArray(deps)) {
        errors.push(
          `Missing or invalid dependency array for domainService "${service}". Expected an array.`
        );
        continue;
      }

      for (const dep of deps) {
        if (!entitySet.has(dep)) {
          errors.push(
            `Invalid dependency "${dep}" in domainService "${service}". Not found in entities.`
          );
        }
      }
    }

    for (const key of Object.keys(config.domainServiceConnections || {})) {
      if (!domainServiceSet.has(key)) {
        errors.push(
          `Unknown domainService "${key}" found in domainServiceConnections.`
        );
      }
    }
  }

  private validateApplicationServices(
    config: OnionConfig,
    domainServiceSet: Set<string>,
    applicationServiceSet: Set<string>,
    entitySet: Set<string>,
    errors: string[]
  ): void {
    if (!Array.isArray(config.applicationServices)) {
      errors.push("`applicationServices` should be an array.");
      return;
    }

    for (const appService of config.applicationServices) {
      this.validateSingleApplicationService(
        appService,
        config,
        domainServiceSet,
        entitySet,
        errors
      );
    }

    this.validateApplicationServiceDependencies(
      config,
      applicationServiceSet,
      errors
    );
  }

  private validateSingleApplicationService(
    appService: string,
    config: OnionConfig,
    domainServiceSet: Set<string>,
    entitySet: Set<string>,
    errors: string[]
  ): void {
    const deps = config.applicationServiceDependencies?.[appService];
    if (!deps || typeof deps !== "object") {
      errors.push(
        `Missing or invalid dependencies for applicationService "${appService}".`
      );
      return;
    }

    const { domainServices, repositories } = deps;

    if (!Array.isArray(domainServices)) {
      errors.push(
        `Missing "domainServices" array for applicationService "${appService}".`
      );
    } else {
      for (const domainDep of domainServices) {
        if (!domainServiceSet.has(domainDep)) {
          errors.push(
            `Invalid domainService "${domainDep}" in applicationService "${appService}". Not found in domainServices.`
          );
        }
      }
    }

    if (!Array.isArray(repositories)) {
      errors.push(
        `Missing "repositories" array for applicationService "${appService}".`
      );
      return;
    }

    for (const repo of repositories) {
      const match = RegExp(/^I(.+)Repository$/).exec(repo);
      if (!match || !entitySet.has(match[1])) {
        errors.push(
          `Invalid repository "${repo}" in applicationService "${appService}". Expected format: I<Entity>Repository where Entity exists in entities.`
        );
      }
    }
  }

  private validateApplicationServiceDependencies(
    config: OnionConfig,
    applicationServiceSet: Set<string>,
    errors: string[]
  ): void {
    const appDeps = config.applicationServiceDependencies || {};

    for (const key of Object.keys(appDeps)) {
      if (!applicationServiceSet.has(key)) {
        errors.push(
          `Unknown applicationService "${key}" found in applicationServiceDependencies.`
        );
      }
    }

    for (const service of applicationServiceSet) {
      // eslint-disable-next-line no-prototype-builtins
      if (!appDeps.hasOwnProperty(service)) {
        errors.push(
          `Missing dependency definition for applicationService "${service}" in applicationServiceDependencies.`
        );
      }
    }
  }
  private validateUiFramework(
    uiFramework: keyof UIFrameworks | undefined,
    errors: string[]
  ): void {
    if (!uiFramework) {
      errors.push("`uiFramework` is required.");
      return;
    }

    if (typeof uiFramework !== "string") {
      errors.push("`uiFramework` should be a string.");
      return;
    }

    if (!isValidUiFramework(uiFramework)) {
      errors.push(
        `Unknown UI framework "${uiFramework}" found in config. Valid frameworks are: ${VALID_UI_FRAMEWORKS.join(", ")}.`
      );
    }
  }
  private validateDiFramework(
    diFramework: DiFramework | undefined,
    errors: string[]
  ): void {
    if (!diFramework) {
      errors.push("`diFramework` is required.");
      return;
    }

    if (typeof diFramework !== "string") {
      errors.push("`diFramework` should be a string.");
      return;
    }

    if (!isValidDiFramework(diFramework)) {
      errors.push(
        `Unknown DI framework "${diFramework}" found in config. Valid frameworks are: ${VALID_DI_FRAMEWORKS.join(", ")}.`
      );
    }
  }
}
