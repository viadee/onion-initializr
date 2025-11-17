// ESLint configuration for CLI project
// Extends root config but disables module boundary enforcement
// and layer restrictions due to direct imports from gh-pages project

const rootConfig = require('../eslint.config.js');

module.exports = [
  ...rootConfig.filter(config => {
    // Remove layer restriction rules from CLI
    return !config.files?.some(
      pattern =>
        pattern.includes('**/application/**') ||
        pattern.includes('**/domain/**')
    );
  }),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': 'off', // Disabled due to cross-project imports
      'no-restricted-imports': 'off', // Disabled due to cross-layer imports needed for CLI
    },
  },
];
