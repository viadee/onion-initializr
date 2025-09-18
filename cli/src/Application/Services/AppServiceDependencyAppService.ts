import { DomainService } from "../../../../lib/Domain/Entities/DomainService";
import { ApplicationService } from "../../../../lib/Domain/Entities/ApplicationService";

/**
 * Service for managing application service dependencies through user interaction.
 * Prompts the user to select domain services and repository interfaces for each application service.
 */
export class AppServiceDependencyAppService {
  /**
   * Prompts the user to pick domain-service names and repository-interface
   * names for each application service.
   *
   * @param applicationServices Array of application services to configure
   * @param domainServices Array of available domain services
   * @param repositoryInterfaces Array of available repository interface names
   * @returns Promise resolving to a map of application service names to their dependencies
   */
  async pickDependencies(
    applicationServices: ApplicationService[],
    domainServices: DomainService[],
    repositoryInterfaces: string[]
  ): Promise<
    Record<string, { domainServices: string[]; repositories: string[] }>
  > {
    const inquirer =
      (await import("inquirer")).default ?? (await import("inquirer"));
    const dependencies: Record<
      string,
      { domainServices: string[]; repositories: string[] }
    > = {};

    for (const appService of applicationServices) {
      const { chosenDomainServices } = await inquirer.prompt([
        {
          type: "checkbox",
          name: "chosenDomainServices",
          message: `Select Domain Services for ${appService.name}:`,
          choices: domainServices.map((svc) => ({
            name: svc.serviceName, // what the user sees
            value: svc.serviceName, // what we store
          })),
        },
      ]);

      const { chosenRepos } = await inquirer.prompt([
        {
          type: "checkbox",
          name: "chosenRepos",
          message: `Select Repositories for ${appService.name}:`,
          choices: repositoryInterfaces,
        },
      ]);

      dependencies[appService.name] = {
        domainServices: chosenDomainServices as string[],
        repositories: chosenRepos as string[],
      };
    }

    return dependencies;
  }
}
