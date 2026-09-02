import { BTreeNode } from '../structures/BTreeNode';

export interface BTreeLayoutNode<T> {
  id: string;
  keys: T[];
  x: number;
  y: number;
  width: number;
}

export interface BTreeEdgeData {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface BTreeLayoutData<T> {
  nodes: BTreeLayoutNode<T>[];
  edges: BTreeEdgeData[];
}

// Must match the constants BTreeCanvas draws with.
export const BTREE_KEY_WIDTH = 44;
export const BTREE_NODE_HEIGHT = 40;
const SUBTREE_GAP = 24;

export function computeBTreeLayout<T>(
  root: BTreeNode<T> | null,
  canvasWidth: number,
  levelHeight: number = 90
): BTreeLayoutData<T> {
  const nodes: BTreeLayoutNode<T>[] = [];
  const edges: BTreeEdgeData[] = [];

  if (!root) return { nodes, edges };

  // Bottom-up: the horizontal footprint a subtree needs so unevenly sized
  // sibling subtrees never overlap.
  const widthCache = new Map<string, number>();
  const subtreeWidth = (node: BTreeNode<T>): number => {
    const cached = widthCache.get(node.id);
    if (cached !== undefined) return cached;
    const ownWidth = node.keys.length * BTREE_KEY_WIDTH;
    let width = ownWidth;
    if (!node.leaf && node.children.length > 0) {
      const childrenWidth = node.children.reduce((sum, c) => sum + subtreeWidth(c), 0)
        + SUBTREE_GAP * (node.children.length - 1);
      width = Math.max(ownWidth, childrenWidth);
    }
    widthCache.set(node.id, width);
    return width;
  };

  // Top-down: place each node centered above the span of its children.
  const place = (node: BTreeNode<T>, centerX: number, depth: number): void => {
    const y = depth * levelHeight + 60;
    const ownWidth = node.keys.length * BTREE_KEY_WIDTH;
    nodes.push({ id: node.id, keys: [...node.keys], x: centerX, y, width: ownWidth });

    if (!node.leaf && node.children.length > 0) {
      const widths = node.children.map(subtreeWidth);
      const totalWidth = widths.reduce((a, b) => a + b, 0) + SUBTREE_GAP * (node.children.length - 1);
      let cursor = centerX - totalWidth / 2;
      node.children.forEach((child, i) => {
        const w = widths[i];
        const childCenterX = cursor + w / 2;
        const childY = (depth + 1) * levelHeight + 60;
        const sourceX = centerX - ownWidth / 2 + ownWidth * ((i + 0.5) / node.children.length);
        edges.push({
          id: `${node.id}-${child.id}`,
          sourceX,
          sourceY: y + BTREE_NODE_HEIGHT / 2,
          targetX: childCenterX,
          targetY: childY - BTREE_NODE_HEIGHT / 2
        });
        place(child, childCenterX, depth + 1);
        cursor += w + SUBTREE_GAP;
      });
    }
  };

  const totalWidth = subtreeWidth(root);
  place(root, totalWidth / 2, 0);

  // Re-center the whole tree within the canvas.
  const shiftX = canvasWidth / 2 - totalWidth / 2;
  nodes.forEach(n => { n.x += shiftX; });
  edges.forEach(e => { e.sourceX += shiftX; e.targetX += shiftX; });

  return { nodes, edges };
}
