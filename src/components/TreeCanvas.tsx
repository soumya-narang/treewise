import type { TreeLayoutData } from '../layout/TreeLayout';

interface TreeCanvasProps<T> {
  layout: TreeLayoutData<T>;
  width: number;
  height: number;
  onNodeClick?: (value: T) => void;
  selectedNodeValues?: T[];
}

export function TreeCanvas<T>({ layout, width, height, onNodeClick, selectedNodeValues = [] }: TreeCanvasProps<T>) {
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0, 0, 0, 0.05)" />
        </filter>
      </defs>

      {/* Edges */}
      <g>
        {layout.edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.sourceX}
            y1={edge.sourceY}
            x2={edge.targetX}
            y2={edge.targetY}
            stroke="var(--edge-color)"
            strokeWidth="2"
            style={{ transition: 'all 0.5s ease-in-out' }}
          />
        ))}
      </g>

      {/* Nodes */}
      <g>
        {layout.nodes.map((node) => (
          <g
            key={node.id}
            onClick={() => onNodeClick && onNodeClick(node.value)}
            style={{
              transform: `translate(${node.x}px, ${node.y}px)`,
              transition: 'transform 0.5s ease-in-out',
              cursor: onNodeClick ? 'pointer' : 'default',
            }}
          >
            <circle
              r="24"
              fill="var(--node-bg)"
              stroke={selectedNodeValues.includes(node.value) ? 'var(--accent-color)' : 'var(--node-border)'}
              strokeWidth={selectedNodeValues.includes(node.value) ? '3' : '2'}
              filter="url(#shadow)"
              style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
            />
            <text
              textAnchor="middle"
              alignmentBaseline="central"
              fill="var(--node-text)"
              fontSize="16"
              fontWeight="500"
              fontFamily="Inter"
              pointerEvents="none"
            >
              {String(node.value)}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
