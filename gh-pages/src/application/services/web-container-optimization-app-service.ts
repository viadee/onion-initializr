import { DiFramework } from '../../../../lib/domain/entities/di-framework';
import { UIFrameworks } from '../../../../lib/domain/entities/ui-framework';

export interface PreBundledDependencies {
  awilix: boolean;
  eslint: boolean;
  prettier: boolean;
  typescript: boolean;
  react?: boolean;
  lit?: boolean;
  vue?: boolean;
  angular?: boolean;
}

export interface PackageJsonStructure {
  name: string;
  version: string;
  type: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export interface LockFileConfig {
  framework: keyof UIFrameworks;
  diFramework: DiFramework;
  packageJsonPath: string;
  lockFilePath: string;
}

export class WebContainerOptimizationService {
  private static readonly BASE_DEPENDENCIES = {
    typescript: '^5.6.0',
  };

  private static readonly BASE_DEV_DEPENDENCIES = {
    eslint: '^9.32.0',
    prettier: '^3.3.0',
    '@eslint/js': '^9.32.0',
    '@typescript-eslint/parser': '^8.36.0',
    '@typescript-eslint/eslint-plugin': '^8.36.0',
    'eslint-plugin-prettier': '^5.2.1',
    '@types/node': '^20.16.0',
  };

  private static readonly AWILIX_DEPENDENCIES = {
    awilix: '^10.0.2',
  };

  private static readonly FRAMEWORK_DEPENDENCIES = {
    react: {
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
      devDependencies: {
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.0',
        vite: '^5.4.0',
      },
    },
    vue: {
      dependencies: {
        vue: '^3.4.0',
      },
      devDependencies: {
        '@vitejs/plugin-vue': '^5.1.0',
        '@vue/compiler-sfc': '^3.4.0',
        vite: '^5.4.0',
      },
    },
    angular: {
      dependencies: {
        '@angular/animations': '^19.0.0',
        '@angular/common': '^19.0.0',
        '@angular/compiler': '^19.0.0',
        '@angular/core': '^19.0.0',
        '@angular/forms': '^19.0.0',
        '@angular/platform-browser': '^19.0.0',
        '@angular/platform-browser-dynamic': '^19.0.0',
        '@angular/router': '^19.0.0',
        rxjs: '^7.8.1',
        tslib: '^2.6.0',
        'zone.js': '^0.14.0',
      },
      devDependencies: {
        '@angular-devkit/build-angular': '^19.0.0',
        '@angular/cli': '^19.0.0',
        '@angular/compiler-cli': '^19.0.0',
      },
    },
    lit: {
      dependencies: {
        lit: '^3.2.0',
      },
      devDependencies: {
        '@types/lit': '^3.0.0',
        vite: '^5.4.0',
      },
    },
    vanilla: {
      dependencies: {},
      devDependencies: {
        vite: '^5.4.0',
      },
    },
  };

  private static readonly BASE_SCRIPTS = {
    lint: 'eslint . --ext .ts,.tsx,.js,.jsx',
    format: 'prettier --write .',
    build: 'tsc',
  };

  /**
   * Get all supported lock file configurations
   */
  static getLockFileConfigurations(): LockFileConfig[] {
    const configs: LockFileConfig[] = [];

    // Add all framework + awilix combinations
    const frameworks: (keyof UIFrameworks)[] = [
      'react',
      'vue',
      'angular',
      'lit',
      'vanilla',
    ];

    frameworks.forEach(framework => {
      configs.push({
        framework,
        diFramework: 'awilix',
        packageJsonPath: `/lockfiles/${framework}-awilix/package.json`,
        lockFilePath: `/lockfiles/${framework}-awilix/package-lock.json`,
      });
    });

    // Add Angular with Angular DI
    configs.push({
      framework: 'angular',
      diFramework: 'angular',
      packageJsonPath: `/lockfiles/angular-angular/package.json`,
      lockFilePath: `/lockfiles/angular-angular/package-lock.json`,
    });

    return configs;
  }

  /**
   * Create a complete package.json for a specific framework and DI combination
   */
  static createPackageJson(
    framework: keyof UIFrameworks,
    diFramework: DiFramework
  ): PackageJsonStructure {
    const frameworkConfig = this.FRAMEWORK_DEPENDENCIES[framework];

    const dependencies = {
      ...this.BASE_DEPENDENCIES,
      ...frameworkConfig.dependencies,
    };

    const devDependencies = {
      ...this.BASE_DEV_DEPENDENCIES,
      ...frameworkConfig.devDependencies,
    };

    // Add DI framework dependencies
    if (diFramework === 'awilix') {
      Object.assign(dependencies, this.AWILIX_DEPENDENCIES);
    }
    // Angular DI is already included in Angular framework dependencies

    // Framework-specific scripts
    const scripts = { ...this.BASE_SCRIPTS };

    if (framework === 'angular') {
      Object.assign(scripts, {
        start: 'ng serve',
        build: 'ng build',
        watch: 'ng build --watch --configuration development',
        test: 'ng test',
      });
    } else if (framework !== 'vanilla') {
      Object.assign(scripts, {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      });
    }

    return {
      name: `onion-architecture-${framework}-${diFramework}`,
      version: '1.0.0',
      type: 'module',
      dependencies,
      devDependencies,
      scripts,
    };
  }

  /**
   * Get the appropriate lock file configuration for a framework and DI combination
   */
  static getLockFileConfig(
    framework: keyof UIFrameworks,
    diFramework: DiFramework
  ): LockFileConfig | null {
    const configs = this.getLockFileConfigurations();
    return (
      configs.find(
        config =>
          config.framework === framework && config.diFramework === diFramework
      ) || null
    );
  }

  /**
   * Generate all package.json files for lock file generation
   */
  static generateAllPackageJsonFiles(): Array<{
    config: LockFileConfig;
    packageJson: PackageJsonStructure;
  }> {
    const configs = this.getLockFileConfigurations();

    return configs.map(config => ({
      config,
      packageJson: this.createPackageJson(config.framework, config.diFramework),
    }));
  }

  /**
   * Get additional dependencies that need to be installed on top of the base lock file
   * This is for any project-specific dependencies that aren't in the pre-built lock files
   */
  static getAdditionalDependencies(
    _framework: keyof UIFrameworks,
    _diFramework: DiFramework
  ): string[] {
    // For now, return empty array as we're including everything in the lock files
    // In the future, we could add project-specific dependencies here
    return [];
  }

  /**
   * Legacy method for backward compatibility
   */
  static createPreBundledPackageJson(framework: string): PackageJsonStructure {
    return this.createPackageJson(framework as keyof UIFrameworks, 'awilix');
  }
}
