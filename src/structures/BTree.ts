import { BTreeNode } from './BTreeNode';

/**
 * A standard CLRS-style B-tree of minimum degree `t` (default 2, i.e. a
 * 2-3-4 tree: every node holds 1-3 keys and, if internal, 2-4 children).
 *   - insert: single-pass top-down insertion that proactively splits any
 *     full node (2t-1 keys) it passes through, so the recursion never has
 *     to propagate a split back up.
 *   - delete: the textbook recursive procedure - deleting from a leaf is a
 *     simple removal, deleting from an internal node swaps in the
 *     predecessor/successor key, and any child about to be recursed into
 *     that only has the minimum (t-1) keys is first topped up by
 *     borrowing from a sibling or merging with one, so the recursion
 *     never descends into a node it could underflow.
 */
export class BTree<T> {
  root: BTreeNode<T> | null = null;
  // The minimum degree (commonly called the tree's "order"). Public and
  // mutable because it's a fixed choice made before any insertion - the UI
  // sets it once up front, and changing it always goes hand in hand with
  // clearing `root`, since an existing tree's shape is only valid under the
  // order it was built with.
  order: number;

  constructor(order: number = 2) {
    this.order = order;
  }

  private maxKeys(): number {
    return 2 * this.order - 1;
  }

  contains(value: T): boolean {
    return this.search(this.root, value) !== null;
  }

  private search(node: BTreeNode<T> | null, value: T): BTreeNode<T> | null {
    if (!node) return null;
    let i = 0;
    while (i < node.keys.length && value > node.keys[i]) i++;
    if (i < node.keys.length && node.keys[i] === value) return node;
    if (node.leaf) return null;
    return this.search(node.children[i], value);
  }

  /** Returns true if the value was inserted, false if it was already present. */
  insert(value: T): boolean {
    if (this.contains(value)) return false;

    if (!this.root) {
      const root = new BTreeNode<T>();
      root.keys = [value];
      root.leaf = true;
      this.root = root;
      return true;
    }

    if (this.root.keys.length === this.maxKeys()) {
      const newRoot = new BTreeNode<T>();
      newRoot.leaf = false;
      newRoot.children = [this.root];
      this.splitChild(newRoot, 0);
      this.root = newRoot;
    }

    this.insertNonFull(this.root, value);
    return true;
  }

  private splitChild(parent: BTreeNode<T>, index: number): void {
    const t = this.order;
    const fullChild = parent.children[index];
    const newChild = new BTreeNode<T>();
    newChild.leaf = fullChild.leaf;

    const midKey = fullChild.keys[t - 1];
    newChild.keys = fullChild.keys.slice(t);
    fullChild.keys = fullChild.keys.slice(0, t - 1);

    if (!fullChild.leaf) {
      newChild.children = fullChild.children.slice(t);
      fullChild.children = fullChild.children.slice(0, t);
    }

    parent.children.splice(index + 1, 0, newChild);
    parent.keys.splice(index, 0, midKey);
  }

  private insertNonFull(node: BTreeNode<T>, value: T): void {
    let i = node.keys.length - 1;

    if (node.leaf) {
      while (i >= 0 && value < node.keys[i]) i--;
      node.keys.splice(i + 1, 0, value);
      return;
    }

    while (i >= 0 && value < node.keys[i]) i--;
    i++;

    if (node.children[i].keys.length === this.maxKeys()) {
      this.splitChild(node, i);
      if (value > node.keys[i]) i++;
    }

    this.insertNonFull(node.children[i], value);
  }

  delete(value: T): void {
    if (!this.root) return;
    this.deleteKey(this.root, value);
    if (this.root.keys.length === 0) {
      this.root = this.root.leaf ? null : this.root.children[0];
    }
  }

  private findKeyIndex(node: BTreeNode<T>, value: T): number {
    let idx = 0;
    while (idx < node.keys.length && node.keys[idx] < value) idx++;
    return idx;
  }

  private deleteKey(node: BTreeNode<T>, value: T): void {
    const t = this.order;
    const idx = this.findKeyIndex(node, value);

    if (idx < node.keys.length && node.keys[idx] === value) {
      if (node.leaf) {
        node.keys.splice(idx, 1);
      } else {
        this.deleteFromInternal(node, idx);
      }
      return;
    }

    if (node.leaf) return; // value not present

    const wasLastChild = idx === node.keys.length;
    if (node.children[idx].keys.length < t) {
      this.fill(node, idx);
    }

    // fill() may have merged the target child into its left sibling,
    // shrinking node.keys - re-check where the target child ended up.
    if (wasLastChild && idx > node.keys.length) {
      this.deleteKey(node.children[idx - 1], value);
    } else {
      this.deleteKey(node.children[idx], value);
    }
  }

  private deleteFromInternal(node: BTreeNode<T>, idx: number): void {
    const t = this.order;
    const key = node.keys[idx];

    if (node.children[idx].keys.length >= t) {
      const pred = this.getPredecessor(node, idx);
      node.keys[idx] = pred;
      this.deleteKey(node.children[idx], pred);
    } else if (node.children[idx + 1].keys.length >= t) {
      const succ = this.getSuccessor(node, idx);
      node.keys[idx] = succ;
      this.deleteKey(node.children[idx + 1], succ);
    } else {
      this.merge(node, idx);
      this.deleteKey(node.children[idx], key);
    }
  }

  private getPredecessor(node: BTreeNode<T>, idx: number): T {
    let current = node.children[idx];
    while (!current.leaf) current = current.children[current.children.length - 1];
    return current.keys[current.keys.length - 1];
  }

  private getSuccessor(node: BTreeNode<T>, idx: number): T {
    let current = node.children[idx + 1];
    while (!current.leaf) current = current.children[0];
    return current.keys[0];
  }

  private fill(node: BTreeNode<T>, idx: number): void {
    const t = this.order;
    if (idx !== 0 && node.children[idx - 1].keys.length >= t) {
      this.borrowFromPrev(node, idx);
    } else if (idx !== node.children.length - 1 && node.children[idx + 1].keys.length >= t) {
      this.borrowFromNext(node, idx);
    } else if (idx !== node.children.length - 1) {
      this.merge(node, idx);
    } else {
      this.merge(node, idx - 1);
    }
  }

  private borrowFromPrev(node: BTreeNode<T>, idx: number): void {
    const child = node.children[idx];
    const sibling = node.children[idx - 1];

    child.keys.unshift(node.keys[idx - 1]);
    if (!sibling.leaf) {
      child.children.unshift(sibling.children.pop()!);
    }
    node.keys[idx - 1] = sibling.keys.pop()!;
  }

  private borrowFromNext(node: BTreeNode<T>, idx: number): void {
    const child = node.children[idx];
    const sibling = node.children[idx + 1];

    child.keys.push(node.keys[idx]);
    if (!sibling.leaf) {
      child.children.push(sibling.children.shift()!);
    }
    node.keys[idx] = sibling.keys.shift()!;
  }

  private merge(node: BTreeNode<T>, idx: number): void {
    const child = node.children[idx];
    const sibling = node.children[idx + 1];

    child.keys.push(node.keys[idx]);
    child.keys.push(...sibling.keys);
    if (!child.leaf) {
      child.children.push(...sibling.children);
    }

    node.keys.splice(idx, 1);
    node.children.splice(idx + 1, 1);
  }
}
