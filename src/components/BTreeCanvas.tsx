import type { BTreeLayoutData } from '../layout/BTreeLayout';
import { BTREE_KEY_WIDTH, BTREE_NODE_HEIGHT } from '../layout/BTreeLayout';

interface BTreeCanvasProps<T> {
  layout: BTreeLayoutData<T>;
  width: number;
  height: number;
  onKeyClick?: (value: T) => void;
  selectedValues?: T[];
}

export function BTreeCanvas<T>({ layout, width, height, onKeyClick, selectedValues = [] }: BTreeCanvasProps<T>) {
  if (layout.nodes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🌳</div>
        <h2 style={{ fontFamily: 'IBM Plex Sans', fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Nothing on the canvas yet</h2>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '14px' }}>Insert a value or generate a tree to begin.</p>
      </div>
    );
  }

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
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
            strokeWidth="1.6"
            style={{ transition: 'all 0.5s ease-in-out' }}
          />
        ))}
      </g>

      {/* Nodes */}
      <g>
        {layout.nodes.map((node) => {
          const halfWidth = node.width / 2;
          return (
            <g
              key={node.id}
              style={{
                transform: `translate(${node.x}px, ${node.y}px)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            >
              <rect
                x={-halfWidth}
                y={-BTREE_NODE_HEIGHT / 2}
                width={node.width}
                height={BTREE_NODE_HEIGHT}
                rx="6"
                fill="var(--node-bg)"
                stroke="var(--node-border)"
                strokeWidth="1.6"
              />
              {node.keys.map((key, i) => (
                <g key={i}>
                  {i > 0 && (
                    <line
                      x1={-halfWidth + i * BTREE_KEY_WIDTH}
                      y1={-BTREE_NODE_HEIGHT / 2}
                      x2={-halfWidth + i * BTREE_KEY_WIDTH}
                      y2={BTREE_NODE_HEIGHT / 2}
                      stroke="var(--border-color)"
                      strokeWidth="1.2"
                    />
                  )}
                  <text
                    x={-halfWidth + i * BTREE_KEY_WIDTH + BTREE_KEY_WIDTH / 2}
                    y={0}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill={selectedValues.includes(key) ? 'var(--accent-color)' : 'var(--node-text)'}
                    fontSize="15"
                    fontWeight="700"
                    fontFamily="'IBM Plex Mono', monospace"
                    style={{ cursor: onKeyClick ? 'pointer' : 'default', transition: 'fill 0.2s' }}
                    onClick={(e) => { e.stopPropagation(); if (onKeyClick) onKeyClick(key); }}
                  >
                    {String(key)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
