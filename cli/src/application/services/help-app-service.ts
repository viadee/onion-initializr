const HELP_TEXT = `Onion Architecture Generator
────────────────────────────
Erzeugt eine vollständige Onion-Architektur (Domain, Application, Infrastructure)
inklusive Frontend-Gerüst und bestückter Ordnerstruktur.

USAGE
  onion                         Interaktive Eingabe aller benötigten Werte
  onion --config <file>         Vollautomatischer Lauf auf Basis einer JSON-Konfiguration
  onion --scan <src> <json>     Vorhandenes Projekt scannen und JSON-Config erzeugen

FEATURES
  • Onion-Ordnerstruktur mit Domain, Application und Infrastructure
  • Generatoren für Entities, Domain- & Application-Services
  • Repository-Interface + Implementierungsskelett
  • Dependency-Injection via Awilix
  • Vorgefertigte Prettier- & ESLint-Konfiguration
  • Frontend-Setup: Lit, React, Angular, Vue oder Vanilla
  • Wahlweise interaktive Prompts oder reine JSON-Config

EXAMPLES
  onion                                   # startet interaktiv
  onion --config myConfig.json            # nutzt vorhandene Konfig-Datei
  onion --scan .\\react\\ reactConfig.json  # erstellt Konfig aus bestehendem Projekt

CONFIG NOTES
  • Services ohne Abhängigkeiten brauchen ein leeres Array, z. B. "UserService": []
  • Zulässige uiFramework-Werte: react | angular | vue | lit | vanilla
  • "folderPath" darf relativ oder absolut sein.
`;
export class HelpAppService {
  handleHelp(): void {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
      console.log(HELP_TEXT);
      process.exit(0);
    }
  }
}
