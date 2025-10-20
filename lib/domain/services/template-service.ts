import Handlebars from 'handlebars';

export class TemplateService<T> {
  private readonly template: Handlebars.TemplateDelegate;
  private static helpersRegistered = false;

  constructor(templateSource: string) {
    // Ensure helpers are registered once
    if (!TemplateService.helpersRegistered) {
      this.registerHandlebarsHelpers();
      TemplateService.helpersRegistered = true;
    }

    this.template = Handlebars.compile(templateSource);
  }

  render(data: T): string {
    return this.template(data);
  }

  private registerHandlebarsHelpers(): void {
    this.registerStringHelpers();
    this.registerArrayHelpers();
    this.registerUtilityHelpers();
  }

  private registerStringHelpers(): void {
    Handlebars.registerHelper('lowerFirst', (str: unknown) => {
      if (typeof str !== 'string' || !str.length) return '';
      return str.charAt(0).toLowerCase() + str.slice(1);
    });

    Handlebars.registerHelper('removeFirst', (str: unknown) => {
      if (typeof str !== 'string' || str.length < 2) return '';
      return str.slice(1);
    });

    Handlebars.registerHelper('camel', (str: unknown) => {
      if (typeof str !== 'string' || !str.length) return '';
      return str.charAt(0).toLowerCase() + str.slice(1);
    });

    Handlebars.registerHelper('toUpperSnakeCase', (str: unknown) => {
      if (typeof str !== 'string' || !str.length) return '';
      return str
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '');
    });
  }

  private registerArrayHelpers(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Handlebars.registerHelper('index', (arr: any[], idx: number) => arr[idx]);
  }

  private registerUtilityHelpers(): void {
    Handlebars.registerHelper('firstRepoVarName', (repos: unknown[]) => {
      if (!Array.isArray(repos) || typeof repos[0] !== 'string') return '';
      const raw = repos[0]; // e.g., 'IUserRepository'
      if (raw.length < 2) return raw.toLowerCase(); // edge case
      return raw.charAt(1).toLowerCase() + raw.slice(2); // remove "I" and lower first real char
    });

    Handlebars.registerHelper('firstServiceVarName', (services: unknown[]) => {
      if (!Array.isArray(services) || typeof services[0] !== 'string')
        return '';
      const raw = services[0];
      return raw.charAt(0).toLowerCase() + raw.slice(1); // UserService → userService
    });
  }
}
