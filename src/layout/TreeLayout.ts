import { TreeNode } from '../structures/TreeNode';

export interface LayoutNode<T> {
  id: string;
  value: T;
  x: number;
  y: number;
  leftId: string | null;
  rightId: string | null;
}

export interface TreeEdgeData {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface TreeLayoutData<T> {
  nodes: LayoutNode<T>[];
  edges: TreeEdgeData[];
}

export function computeTreeLayout<T>(
  root: TreeNode<T> | null,
  canvasWidth: number,
  levelHeight: number = 80
): TreeLayoutData<T> {
  const nodes: LayoutNode<T>[] = [];
  const edges: TreeEdgeData[] = [];

  if (!root) {
    return { nodes, edges };
  }

  // To make the layout clean and explainable, we'll assign x based on available width slices
  // but ensure nodes at the same level don't overlap too much.
  const paddingX = 40; // minimum horizontal space from edges
  const assignCoordinates = (
    node: TreeNode<T>,
    depth: number,
    minX: number,
    maxX: number
  ) => {
    const x = (minX + maxX) / 2;
    const y = depth * levelHeight + 60; // 60px top padding

    nodes.push({
      id: node.id,
      value: node.value,
      x,
      y,
      leftId: node.left?.id || null,
      rightId: node.right?.id || null
    });

    if (node.left) {
      assignCoordinates(node.left, depth + 1, minX, x);
      // Let's compute edge targets based on where we think the children will end up
      const targetX = (minX + x) / 2;
      const targetY = (depth + 1) * levelHeight + 60;
      edges.push({
        id: `${node.id}-${node.left.id}`,
        sourceX: x,
        sourceY: y,
        targetX,
        targetY
      });
    }

    if (node.right) {
      assignCoordinates(node.right, depth + 1, x, maxX);
      const targetX = (x + maxX) / 2;
      const targetY = (depth + 1) * levelHeight + 60;
      edges.push({
        id: `${node.id}-${node.right.id}`,
        sourceX: x,
        sourceY: y,
        targetX,
        targetY
      });
    }
  };

  assignCoordinates(root, 0, paddingX, canvasWidth - paddingX);

  return { nodes, edges };
}
