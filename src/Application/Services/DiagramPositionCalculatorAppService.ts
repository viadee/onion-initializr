import { ItemPosition } from '../../Domain/Entities/Diagramm';
import { DiagramConfigurationAppService } from './DiagramConfigurationAppService';

export interface DiagramCenter {
  x: number;
  y: number;
}

export class DiagramPositionCalculatorAppService {
  constructor(
    private readonly diagramConfigurationAppService: DiagramConfigurationAppService
  ) {}

  calculateItemPositions(
    groups: Array<{ name: string; items: string[]; radius: number }>
  ): Record<string, ItemPosition> {
    const positions: Record<string, ItemPosition> = {};
    const center = this.diagramConfigurationAppService.center;

    groups.forEach(group => {
      const step = (2 * Math.PI) / group.items.length || 1;
      group.items.forEach((name: string, idx: number) => {
        const angle = idx * step - Math.PI / 2;
        positions[name] = {
          x: center.x + group.radius * Math.cos(angle),
          y: center.y + group.radius * Math.sin(angle),
          ring: group.name,
        };
      });
    });

    return positions;
  }

  calculateNodePosition(
    radius: number,
    index: number,
    total: number
  ): { x: number; y: number } {
    const angleStep = (2 * Math.PI) / total;
    const angle = index * angleStep - Math.PI / 2;
    const center = this.diagramConfigurationAppService.center;

    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  }
}
