const HELP_TEXT = `Onion Architecture Generator
────────────────────────────
Generates a complete Onion Architecture (Domain, Application, Infrastructure)
including frontend scaffolding and populated folder structure.

USAGE
  onion                         Interactive input of all required values
  onion --config <file>         Fully automated run based on JSON configuration
  onion --scan <src> <json>     Scan existing project and generate JSON config

FEATURES
  • Onion folder structure with Domain, Application and Infrastructure
  • Generators for Entities, Domain & Application Services
  • Repository interface + implementation skeleton
  • Dependency Injection via Awilix
  • Pre-configured Prettier & ESLint setup
  • Frontend setup: Lit, React, Angular, Vue or Vanilla
  • Either interactive prompts or pure JSON config

EXAMPLES
  onion                                   # starts interactively
  onion --config myConfig.json            # uses existing config file
  onion --scan .\\react\\ reactConfig.json  # creates config from existing project

CONFIG NOTES
  • Services without dependencies need an empty array, e.g. "UserService": []
  • Valid uiFramework values: react | angular | vue | lit | vanilla
  • "folderPath" can be relative or absolute.
`;
export class HelpAppService {
  handleHelp(): void {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      console.log(HELP_TEXT);
      process.exit(0);
    }
  }
}
