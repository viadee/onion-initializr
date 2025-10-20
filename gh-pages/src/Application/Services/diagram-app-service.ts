import * as d3 from 'd3';
import { DiagramPositionCalculatorAppService } from './diagram-position-calculator-app-service';
import { DiagramSVGRendererAppService } from './diagram-svgrenderer-app-service';
import {
  DiagramConfigurationAppService,
  RingConfig,
} from './diagram-configuration-app-service';
import { ItemPosition } from '../../../../lib/Domain/Entities/Diagramm';
import { OnionConfig } from '../../../../lib/Domain/Entities/onion-config';

interface NodeGroup {
  name: string;
  items: string[];
  radius: number;
  color: string;
}

export class DiagramAppService {
  constructor(
    private readonly diagramConfigurationAppService: DiagramConfigurationAppService,
    private readonly diagramPositionCalculatorAppService: DiagramPositionCalculatorAppService,
    private readonly diagramSVGRendererAppService: DiagramSVGRendererAppService
  ) {}

  private itemPositions: Record<string, ItemPosition> = {};

  private getRingConfigurations(): RingConfig[] {
    return this.diagramConfigurationAppService.getRingConfigurations();
  }

  private getNodeGroups(data: OnionConfig): NodeGroup[] {
    const ringConfigs =
      this.diagramConfigurationAppService.getRingConfigurations();
    const colors = this.diagramConfigurationAppService.diagramColors;

    return [
      {
        name: 'Entities',
        items: data.entities ?? [],
        radius: ringConfigs[0].radius,
        color: colors.entities,
      },
      {
        name: 'Domain Services',
        items: data.domainServices ?? [],
        radius: ringConfigs[1].radius,
        color: colors.domainServices,
      },
      {
        name: 'Application Services',
        items: data.applicationServices ?? [],
        radius: ringConfigs[2].radius,
        color: colors.applicationServices,
      },
      {
        items: this.getAllRepositories(data),
        radius: ringConfigs[3].radius,
        color: colors.repositories,
        name: 'Repositories',
      },
    ];
  }

  private getAllRepositories(data: OnionConfig): string[] {
    const repositories = new Set<string>();

    // Add entity-based repositories
    data.entities?.forEach((entity: unknown) => {
      repositories.add(`I${entity}Repository`);
    });

    // Add infrastructure repositories from applicationServiceDependencies
    if (data.applicationServiceDependencies) {
      Object.values(data.applicationServiceDependencies).forEach(deps => {
        deps.repositories?.forEach((repo: string) => {
          repositories.add(repo);
        });
      });
    }

    return Array.from(repositories);
  }

  createDiagram(
    container: HTMLElement,
    data: OnionConfig,
    onNodeClick: (item: string) => void,
    selectedNode: string | null,
    onBackgroundClick?: () => void
  ) {
    this.itemPositions = {};
    const svg = this.initializeSVG(container, onBackgroundClick);

    this.drawRings(svg);
    this.buildItemPositions(data);
    this.drawConnections(svg, data);

    this.drawNodes(svg, data, onNodeClick, selectedNode);
  }

  private initializeSVG(
    container: HTMLElement,
    onBackgroundClick?: () => void
  ) {
    d3.select(container).selectAll('*').remove();

    const config = this.diagramConfigurationAppService.diagramConfig;
    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height)
      .attr('viewBox', `0 0 ${config.width} ${config.height}`)
      .style('max-width', '100%')
      .style('height', 'auto');

    const mainGroup = svg.append('g');

    // Add background click handler to the SVG element
    // This will catch all clicks that aren't on nodes (which stop propagation)
    if (onBackgroundClick) {
      svg.on('click', () => {
        // This will trigger for any click that reaches the SVG level
        // Nodes prevent this with stopPropagation()
        onBackgroundClick();
      });
    }

    return mainGroup;
  }
  private buildItemPositions(data: OnionConfig): void {
    const groups = this.getNodeGroups(data);
    this.itemPositions =
      this.diagramPositionCalculatorAppService.calculateItemPositions(groups);
  }
  private drawRings(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>
  ): void {
    const rings = this.getRingConfigurations();

    rings.forEach(ring => {
      this.drawRingCircle(svg, ring);
      this.drawRingLabel(svg, ring);
    });
  }

  private drawRingCircle(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    ring: RingConfig
  ): void {
    const center = this.diagramConfigurationAppService.center;
    const colors = this.diagramConfigurationAppService.diagramColors;

    this.diagramSVGRendererAppService.drawRingCircle(
      svg,
      center.x,
      center.y,
      ring.radius,
      ring.color,
      colors.ringStroke
    );
  }

  private drawRingLabel(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    ring: RingConfig
  ): void {
    const center = this.diagramConfigurationAppService.center;

    this.diagramSVGRendererAppService.drawRingLabel(
      svg,
      center.x,
      center.y,
      ring.radius,
      ring.name
    );
  }

  private drawNodes(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: OnionConfig,
    onNodeClick: (item: string) => void,
    selectedNode: string | null
  ): void {
    const nodeGroups = this.getNodeGroups(data);

    nodeGroups.forEach(group => {
      this.drawNodeGroup(svg, group, onNodeClick, selectedNode);
    });
  }

  private drawNodeGroup(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    group: NodeGroup,
    onNodeClick: (item: string) => void,
    selectedNode: string | null
  ): void {
    if (group.items.length === 0) return;

    group.items.forEach((item, index) => {
      const position =
        this.diagramPositionCalculatorAppService.calculateNodePosition(
          group.radius,
          index,
          group.items.length
        );

      this.itemPositions[item] = {
        x: position.x,
        y: position.y,
        ring: group.name,
      };

      const isSelected = item === selectedNode;
      this.drawSingleNode(
        svg,
        item,
        position.x,
        position.y,
        group.color,
        isSelected,
        onNodeClick
      );
    });
  }

  private drawSingleNode(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    item: string,
    x: number,
    y: number,
    groupColor: string,
    isSelected: boolean,
    onNodeClick: (item: string) => void
  ): void {
    const nodeGroup = this.diagramSVGRendererAppService.createNodeGroup(
      svg,
      item,
      onNodeClick
    );

    const config = this.diagramConfigurationAppService.diagramConfig;
    const colors = this.diagramConfigurationAppService.diagramColors;

    this.diagramSVGRendererAppService.drawNodeCircle(nodeGroup, {
      x,
      y,
      groupColor,
      isSelected,
      nodeRadius: config.nodeRadius,
      selectionColor: colors.selection,
    });

    this.diagramSVGRendererAppService.drawNodeText(nodeGroup, x, y, item);
  }

  private drawConnections(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: OnionConfig
  ): void {
    const markerId = this.createArrowMarker(svg);
    const drawnConnections = new Set<string>();

    this.drawDomainServiceConnections(svg, data, markerId, drawnConnections);
    this.drawApplicationServiceConnections(
      svg,
      data,
      markerId,
      drawnConnections
    );
    this.drawRepositoryConnections(svg, data, markerId, drawnConnections);
  }

  private createArrowMarker(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>
  ): string {
    const markerId = `arrowhead-${Date.now()}`;
    const colors = this.diagramConfigurationAppService.diagramColors;

    svg
      .append('defs')
      .append('marker')
      .attr('id', markerId)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', colors.connectionStroke);

    return markerId;
  }

  private drawDomainServiceConnections(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: OnionConfig,
    markerId: string,
    drawnConnections: Set<string>
  ): void {
    if (!data.domainServiceConnections) return;

    Object.entries(data.domainServiceConnections).forEach(
      ([service, entities]) => {
        const fromPos = this.itemPositions[service];
        if (!fromPos) return;

        entities.forEach((entity: string | number) => {
          const toPos = this.itemPositions[entity];
          if (!toPos) return;

          const connectionKey = `${service}->${entity}`;
          if (!drawnConnections.has(connectionKey)) {
            this.drawConnectionLine(svg, fromPos, toPos, markerId);
            drawnConnections.add(connectionKey);
          }
        });
      }
    );
  }

  private drawApplicationServiceConnections(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: OnionConfig,
    markerId: string,
    drawnConnections: Set<string>
  ): void {
    if (!data.applicationServiceDependencies) return;

    Object.entries(data.applicationServiceDependencies).forEach(
      ([appService, deps]) => {
        const fromPos = this.itemPositions[appService];
        if (!fromPos) return;

        deps.domainServices?.forEach((dService: string | number) => {
          const toPos = this.itemPositions[dService];
          if (!toPos) return;

          const connectionKey = `${appService}->${dService}`;
          if (!drawnConnections.has(connectionKey)) {
            this.drawConnectionLine(svg, fromPos, toPos, markerId);
            drawnConnections.add(connectionKey);
          }
        });
      }
    );
  }

  private drawRepositoryConnections(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: OnionConfig,
    markerId: string,
    drawnConnections: Set<string>
  ): void {
    if (!data.applicationServiceDependencies) return;

    Object.entries(data.applicationServiceDependencies).forEach(
      ([appService, deps]) => {
        const appPos = this.itemPositions[appService];
        if (!appPos) return;

        deps.repositories?.forEach((repo: string | number) => {
          const repoPos = this.itemPositions[repo];
          if (!repoPos) return;

          const connectionKey = `${appService}->${repo}`;
          if (!drawnConnections.has(connectionKey)) {
            this.drawConnectionLine(svg, appPos, repoPos, markerId);
            drawnConnections.add(connectionKey);
          }
        });
      }
    );
  }

  private drawConnectionLine(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    fromPos: ItemPosition,
    toPos: ItemPosition,
    markerId: string
  ): void {
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    const colors = this.diagramConfigurationAppService.diagramColors;
    const config = this.diagramConfigurationAppService.diagramConfig;

    svg
      .append('path')
      .attr(
        'd',
        `M${fromPos.x},${fromPos.y} Q${midX},${midY} ${toPos.x},${toPos.y}`
      )
      .attr('fill', 'none')
      .attr('stroke', colors.connectionStroke)
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#${markerId})`)
      .style('opacity', 0)
      .transition()
      .duration(config.animationDuration)
      .style('opacity', 1);
  }
}
