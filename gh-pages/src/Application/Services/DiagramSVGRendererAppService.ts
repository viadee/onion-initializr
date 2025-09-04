import * as d3 from 'd3';

export interface NodeRenderOptions {
  x: number;
  y: number;
  groupColor: string;
  isSelected: boolean;
  nodeRadius: {
    normal: number;
    selected: number;
  };
  selectionColor: string;
}

export class DiagramSVGRendererAppService {
  drawNodeText(
    nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    text: string
  ): void {
    nodeGroup
      .append('text')
      .attr('x', x)
      .attr('y', y + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#333')
      .text(text);
  }

  drawNodeCircle(
    nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    options: NodeRenderOptions
  ): void {
    nodeGroup
      .append('circle')
      .attr('cx', options.x)
      .attr('cy', options.y)
      .attr(
        'r',
        options.isSelected
          ? options.nodeRadius.selected
          : options.nodeRadius.normal
      )
      .attr('fill', options.isSelected ? options.selectionColor : '#ffffff')
      .attr('stroke', options.groupColor)
      .attr('stroke-width', options.isSelected ? 3 : 2)
      .style(
        'filter',
        options.isSelected
          ? 'drop-shadow(0 0 8px rgba(255, 221, 87, 0.8))'
          : 'none'
      );
  }

  createNodeGroup(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    item: string,
    onNodeClick: (item: string) => void
  ): d3.Selection<SVGGElement, unknown, null, undefined> {
    return svg
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', event => {
        event.stopPropagation();
        onNodeClick(item);
      });
  }

  drawRingCircle(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    centerX: number,
    centerY: number,
    radius: number,
    color: string,
    strokeColor: string
  ): void {
    svg
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius)
      .attr('fill', color)
      .attr('fill-opacity', 0.1)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
  }

  drawRingLabel(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    centerX: number,
    centerY: number,
    radius: number,
    text: string
  ): void {
    svg
      .append('text')
      .attr('x', centerX)
      .attr('y', centerY - radius + 60)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(text);
  }
}
