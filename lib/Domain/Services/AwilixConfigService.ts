import { AwilixConfig } from "../Entities/AwilixConfig";
import { FileEntity } from "../Entities/FileEntity";


/**
 * Generates the `awilix.config.ts` file dynamically
 */
export class AwilixConfigService {
  generateAwilixConfigFile(
    params: AwilixConfig,
    awilixConfigPath: string
  ): FileEntity {
    // Collect all class names and camelCase registration keys
    const repoRegistrations = params.entities.map((entity) => {
      const className = `${entity}Repository`;
      return {
        className,
        varName: this.lowerFirst(className),
        importPath: `../../Infrastructure/Repositories/${className}`,
      };
    });

    const entityRegistrations = params.entities.map((entity) => {
      return {
        className: entity,
        varName: this.lowerFirst(entity),
        importPath: `../../Domain/Entities/${entity}`,
      };
    });

    const domainServiceRegistrations = params.domainServices.map((service) => ({
      className: service,
      varName: this.lowerFirst(service),
      importPath: `../../Domain/Services/${service}`,
    }));

    const appServiceRegistrations = params.applicationServices.map(
      (service) => ({
        className: service,
        varName: this.lowerFirst(service),
        importPath: `../../Application/Services/${service}`,
      })
    );

    const allRegistrations = [
      ...entityRegistrations,
      ...repoRegistrations,
      ...domainServiceRegistrations,
      ...appServiceRegistrations,
    ];

    const imports = allRegistrations
      .map(
        ({ className, importPath }) =>
          `import { ${className} } from "${importPath}";`
      )
      .join("\n");

    const registrations = allRegistrations
      .map(
        ({ varName, className }) =>
          `  ${varName}: asClass(${className}).singleton(),`
      )
      .join("\n");

    const fileContent = `
import { createContainer, asClass, InjectionMode } from "awilix";

${imports}

const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

container.register({
${registrations}
});

export default container;
`;

    const file: FileEntity = new FileEntity(awilixConfigPath, fileContent);
    return file;
  }
  private lowerFirst(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
