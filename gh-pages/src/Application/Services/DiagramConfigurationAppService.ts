export interface DiagramColors {
  entities: string;
  domainServices: string;
  applicationServices: string;
  repositories: string;
  selection: string;
  ringStroke: string;
  connectionStroke: string;
}

export interface NodeRadiusConfig {
  normal: number;
  selected: number;
  hoverNormal: number;
  hoverSelected: number;
}

export interface RingRadiusConfig {
  entities: number;
  domainServices: number;
  applicationServices: number;
  repositories: number;
}

export interface DiagramConfig {
  width: number;
  height: number;
  animationDuration: number;
  nodeRadius: NodeRadiusConfig;
  rings: RingRadiusConfig;
}

export interface RingConfig {
  name: string;
  radius: number;
  color: string;
}

export class DiagramConfigurationAppService {
  private readonly config: DiagramConfig = {
    width: 950,
    height: 950,
    animationDuration: 500,
    nodeRadius: {
      normal: 15,
      selected: 20,
      hoverNormal: 18,
      hoverSelected: 22,
    },
    rings: {
      entities: 120,
      domainServices: 220,
      applicationServices: 320,
      repositories: 420,
    },
  };

  private readonly colors: DiagramColors = {
    entities: '#81d34b',
    domainServices: '#b071d9',
    applicationServices: '#61c6d6',
    repositories: '#ff6b6b',
    selection: '#FFA500',
    ringStroke: '#999',
    connectionStroke: 'rgba(68, 68, 68, 0.6)',
  };

  get diagramConfig(): DiagramConfig {
    return this.config;
  }

  get diagramColors(): DiagramColors {
    return this.colors;
  }

  get center(): { x: number; y: number } {
    return {
      x: this.config.width / 2,
      y: this.config.height / 2,
    };
  }

  getRingConfigurations(): RingConfig[] {
    return [
      {
        name: 'Entities',
        radius: this.config.rings.entities,
        color: this.colors.entities,
      },
      {
        name: 'Domain Services',
        radius: this.config.rings.domainServices,
        color: this.colors.domainServices,
      },
      {
        name: 'Application Services',
        radius: this.config.rings.applicationServices,
        color: this.colors.applicationServices,
      },
      {
        name: 'Repositories',
        radius: this.config.rings.repositories,
        color: this.colors.repositories,
      },
    ];
  }
}
