import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CodeDisplayComponent } from '../../components/code-display/code-display.component';

interface Feature {
  title: string;
  description: string;
  icon: string;
  action: 'external' | 'navigate' | 'scroll';
  link: string;
}

interface Company {
  name: string;
  logo: string;
  website: string;
}

@Component({
  selector: 'onion-gen',
  standalone: true,
  imports: [CommonModule, CodeDisplayComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
})
export class HomepageComponent {
  constructor(private readonly router: Router) {}

  features: Feature[] = [
    {
      title: 'Onion Architecture',
      description:
        'Follows onion architecture principles with proper dependency injection.',
      icon: '🏗️',
      action: 'external',
      link: 'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
    },
    {
      title: 'CLI Interface',
      description:
        'Generate projects from your terminal with interactive prompts or JSON configuration file.',
      icon: '🖥️',
      action: 'external',
      link: 'https://github.com/viadee/onion-initializr',
    },
    {
      title: 'Web Interface',
      description:
        'Visual diagram builder to design your architecture and generate projects online.',
      icon: '🌐',
      action: 'navigate',
      link: '/generator',
    },
    {
      title: 'Multiple Frameworks',
      description:
        'Support for React, Angular, Vue, Lit, and Vanilla TypeScript frontends.',
      icon: '⚡',
      action: 'scroll',
      link: 'frameworks',
    },
    {
      title: 'Dependency Injection',
      description:
        'Built-in support for dependency injection with Awilix or Angular DI for Angular Projects.',
      icon: '🔌',
      action: 'navigate',
      link: '/documentation',
    },
    {
      title: 'Example Onion Project',
      description:
        'This Project is also build as an Onion-Architecture and can be used as a reference for your own projects.',
      icon: '📖',
      action: 'external',
      link: 'https://github.com/viadee/onion-initializr',
    },
  ];

  frameworks = [
    {
      name: 'Angular',
      logo: 'angular.svg',
      color: '#DD0031',
      website: 'https://angular.dev',
    },
    {
      name: 'React',
      logo: 'react.svg',
      color: '#61DAFB',
      website: 'https://react.dev',
    },
    {
      name: 'Vue',
      logo: 'vue.svg',
      color: '#4FC08D',
      website: 'https://vuejs.org',
    },
    {
      name: 'Lit',
      logo: 'lit.svg',
      color: '#324FFF',
      website: 'https://lit.dev',
    },
    {
      name: 'Pure TS',
      logo: 'typescript.svg',
      color: '#3178C6',
      website: 'https://www.typescriptlang.org',
    },
  ];

  companies: Company[] = [
    {
      name: 'viadee',
      logo: 'viadee.png',
      website: 'https://www.viadee.de',
    },
  ];

  exampleConfig = `{
  "folderPath": "/Users/B286/Desktop/generatedOnions/myNewLitProject",
  "entities": ["User", "Order", "Product"],
  "domainServices": ["UserService", "PaymentService", "OrderService", "ProductService", "ShippingService"],
  "applicationServices": ["UserAppService", "OrderAppService"],
  "domainServiceConnections": {
    "OrderService": ["Order", "User"],
    "UserService": [],
    "ShippingService": ["Order"],
    "ProductService": ["Product"],
    "PaymentService": []
  },
  "applicationServiceDependencies": {
    "UserAppService": {
      "domainServices": ["UserService"],
      "repositories": ["IUserRepository"]
    },
    "OrderAppService": {
      "domainServices": ["OrderService"],
      "repositories": ["IOrderRepository"]
    }
  },
  "uiFramework": "lit",
  "_chooseFromTheseUI": ["react", "angular", "vue", "lit", "vanilla"],
  "diFramework": "awilix",
  "_chooseFromTheseDI": ["awilix", "angular"]
}`;

  scrollToTryOnline(): void {
    this.router.navigate(['/generator']);
  }

  navigateToGitHub(): void {
    window.open('https://github.com/viadee/onion-initializr', '_blank');
  }

  navigateToDocumentation(): void {
    this.router.navigate(['/documentation']);
  }

  navigateToOnionArchitectureArticle(): void {
    window.open(
      'https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/',
      '_blank'
    );
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openFrameworkWebsite(website: string): void {
    window.open(website, '_blank');
  }

  openCompanyWebsite(website: string): void {
    window.open(website, '_blank');
  }

  handleFeatureClick(feature: Feature): void {
    switch (feature.action) {
      case 'external':
        window.open(feature.link, '_blank');
        break;
      case 'navigate':
        this.router.navigate([feature.link]);
        break;
      case 'scroll':
        this.scrollToSection(feature.link);
        break;
    }
  }

  getFeatureTooltip(feature: Feature): string {
    switch (feature.action) {
      case 'external':
        return `Learn more about ${feature.title}`;
      case 'navigate':
        return `Go to ${feature.title}`;
      case 'scroll':
        return `View the ${feature.title} section`;
      default:
        return `Click to explore ${feature.title}`;
    }
  }
}
