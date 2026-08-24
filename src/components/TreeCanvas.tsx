import { useState } from 'react';
import type { TreeLayoutData } from '../layout/TreeLayout';

interface TreeCanvasProps<T> {
  layout: TreeLayoutData<T>;
  width: number;
  height: number;
  onNodeClick?: (value: T) => void;
  selectedNodeValues?: T[];
}

export function TreeCanvas<T>({ layout, width, height, onNodeClick, selectedNodeValues = [] }: TreeCanvasProps<T>) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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
          const selIndex = selectedNodeValues.indexOf(node.value);
          const isSelected = selIndex !== -1;

          return (
            <g
              key={node.id}
              onClick={() => onNodeClick && onNodeClick(node.value)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              style={{
                transform: `translate(${node.x}px, ${node.y}px)`,
                transition: 'transform 0.5s ease-in-out',
                cursor: onNodeClick ? 'pointer' : 'default',
              }}
            >
              <circle
                r="24"
                fill="var(--node-bg)"
                stroke={isSelected ? 'var(--accent-color)' : 'var(--node-border)'}
                strokeWidth={isSelected ? '2.6' : '1.6'}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
              />
              <text
                textAnchor="middle"
                alignmentBaseline="central"
                fill="var(--node-text)"
                fontSize="16"
                fontWeight="700"
                fontFamily="'IBM Plex Mono', monospace"
                pointerEvents="none"
              >
                {String(node.value)}
              </text>

              {/* Selection Badge */}
              {isSelected && (
                <g transform="translate(18, -18)">
                  <circle r="9" fill="var(--amber-color)" />
                  <text
                    fill="var(--node-bg)"
                    fontSize="11"
                    fontFamily="'IBM Plex Mono', monospace"
                    fontWeight="600"
                    textAnchor="middle"
                    alignmentBaseline="central"
                  >
                    {selIndex + 1}
                  </text>
                </g>
              )}

              {/* Hover Pill */}
              {hoveredNodeId === node.id && (
                <g transform="translate(0, -40)" style={{ animation: 'fadeIn 0.15s ease-out forwards' }}>
                  <rect
                    x="-30"
                    y="-12"
                    width="60"
                    height="24"
                    fill="var(--text-main)"
                    pointerEvents="none"
                  />
                  <text
                    fill="var(--node-bg)"
                    fontSize="12"
                    fontFamily="'IBM Plex Mono', monospace"
                    fontWeight="500"
                    textAnchor="middle"
                    alignmentBaseline="central"
                    pointerEvents="none"
                  >
                    {node.path}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(0, -36px); }
          to { opacity: 1; transform: translate(0, -40px); }
        }
      `}</style>
    </svg>
  );
}
