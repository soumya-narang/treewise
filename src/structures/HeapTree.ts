import { TreeNode } from './TreeNode';

export type HeapKind = 'MIN' | 'MAX';

/**
 * A binary heap (min or max) represented as a linked TreeNode tree rather than
 * the usual flat array. Node positions are still assigned in strict array
 * order (complete binary tree, filled left-to-right level by level) so the
 * insert/delete algorithms match the textbook array-backed heap exactly:
 *   - insert: place the new value at the next open slot, then sift it up.
 *   - delete: move the last slot's value into the removed slot, drop the
 *     last slot, then sift the moved value up or down as needed.
 */
export class HeapTree<T> {
  root: TreeNode<T> | null = null;
  private readonly kind: HeapKind;

  constructor(kind: HeapKind) {
    this.kind = kind;
  }

  // True when `a` belongs strictly closer to the root than `b` does
  // (smaller for a min-heap, larger for a max-heap).
  private hasPriority(a: T, b: T): boolean {
    return this.kind === 'MIN' ? a < b : a > b;
  }

  private size(node: TreeNode<T> | null): number {
    if (!node) return 0;
    return 1 + this.size(node.left) + this.size(node.right);
  }

  // Directions from the root to the node at 1-indexed level-order `index`,
  // derived from the binary digits of `index` (dropping the leading 1 bit).
  private pathDirections(index: number): ('L' | 'R')[] {
    const bits = index.toString(2).slice(1);
    return bits.split('').map(b => (b === '0' ? 'L' : 'R')) as ('L' | 'R')[];
  }

  // Root-to-node chain of the node living at 1-indexed level-order `index`.
  private ancestorsAtIndex(index: number): TreeNode<T>[] {
    const ancestors: TreeNode<T>[] = [this.root!];
    let current = this.root!;
    for (const dir of this.pathDirections(index)) {
      current = dir === 'L' ? current.left! : current.right!;
      ancestors.push(current);
    }
    return ancestors;
  }

  private findPathByValue(
    node: TreeNode<T> | null,
    value: T,
    path: TreeNode<T>[] = []
  ): TreeNode<T>[] | null {
    if (!node) return null;
    const nextPath = [...path, node];
    if (node.value === value) return nextPath;
    return (
      this.findPathByValue(node.left, value, nextPath) ||
      this.findPathByValue(node.right, value, nextPath)
    );
  }

  private swapContents(a: TreeNode<T>, b: TreeNode<T>): void {
    const value = a.value;
    const id = a.id;
    a.value = b.value;
    a.id = b.id;
    b.value = value;
    b.id = id;
  }

  // Bubbles the last node in `path` up while it has priority over its
  // parent. Returns the node object where the value ends up.
  private siftUp(path: TreeNode<T>[]): TreeNode<T> {
    let index = path.length - 1;
    while (index > 0) {
      const child = path[index];
      const parent = path[index - 1];
      if (this.hasPriority(child.value, parent.value)) {
        this.swapContents(parent, child);
        index--;
      } else {
        break;
      }
    }
    return path[index];
  }

  private siftDown(node: TreeNode<T>): void {
    let current = node;
    while (true) {
      let best = current;
      if (current.left && this.hasPriority(current.left.value, best.value)) {
        best = current.left;
      }
      if (current.right && this.hasPriority(current.right.value, best.value)) {
        best = current.right;
      }
      if (best === current) return;
      this.swapContents(current, best);
      current = best;
    }
  }

  private detach(parent: TreeNode<T> | null, node: TreeNode<T>): void {
    if (!parent) {
      this.root = null;
      return;
    }
    if (parent.left === node) parent.left = null;
    else if (parent.right === node) parent.right = null;
  }

  /** Returns true if the value was inserted (heaps here reject duplicates,
   * matching the BST/AVL trees, since node selection is done by value). */
  insert(value: T): boolean {
    if (this.findPathByValue(this.root, value)) return false;

    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return true;
    }

    const nextIndex = this.size(this.root) + 1;
    const dirs = this.pathDirections(nextIndex);
    const ancestors: TreeNode<T>[] = [this.root];
    let current = this.root;
    for (let i = 0; i < dirs.length - 1; i++) {
      current = dirs[i] === 'L' ? current.left! : current.right!;
      ancestors.push(current);
    }
    if (dirs[dirs.length - 1] === 'L') current.left = newNode;
    else current.right = newNode;
    ancestors.push(newNode);

    this.siftUp(ancestors);
    return true;
  }

  delete(value: T): void {
    if (!this.root) return;
    const targetPath = this.findPathByValue(this.root, value);
    if (!targetPath) return;
    const target = targetPath[targetPath.length - 1];

    const size = this.size(this.root);
    const lastAncestors = this.ancestorsAtIndex(size);
    const lastNode = lastAncestors[lastAncestors.length - 1];
    const lastParent = lastAncestors.length > 1 ? lastAncestors[lastAncestors.length - 2] : null;

    if (target === lastNode) {
      this.detach(lastParent, lastNode);
      return;
    }

    target.value = lastNode.value;
    target.id = lastNode.id;
    this.detach(lastParent, lastNode);

    const restingNode = this.siftUp(targetPath);
    if (restingNode === target) {
      this.siftDown(target);
    }
  }
}
