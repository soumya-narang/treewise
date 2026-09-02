import { BTreeNode } from './BTreeNode';

/**
 * A B-tree of order `m`: every node has at most `m` children, so at most
 * m-1 keys, and (except the root) at least ceil(m/2) children, so at
 * least ceil(m/2)-1 keys. This is the "order" most DSA courses teach -
 * not CLRS's "minimum degree t" (max keys 2t-1); the two conventions only
 * coincide when m is even, where t = m/2.
 *   - insert: ordinary recursive descent to a leaf, insert there, then on
 *     the way back up split any node that now holds m keys (one over the
 *     m-1 limit), promoting its middle key into the parent. If the root
 *     itself overflows, a new root is created above it.
 *   - delete: ordinary recursive descent to find the value (swapping an
 *     internal match down to its predecessor leaf first), remove it from
 *     the leaf it actually lives at, then on the way back up top off any
 *     child that dropped below the minimum by borrowing from a sibling or
 *     merging with one. Fixing underflow bottom-up (only after the real
 *     removal already happened) rather than top-down (pre-emptively,
 *     before descending) is what keeps a merge from ever overflowing: it
 *     always combines an already-short child with a normal one, which
 *     fits within the m-1 cap for every order, even or odd.
 */
export class BTree<T> {
  root: BTreeNode<T> | null = null;
  // The tree's order (m): the maximum number of children per node. Public
  // and mutable because it's a fixed choice made before any insertion -
  // the UI sets it once up front, and changing it always goes hand in
  // hand with clearing `root`, since an existing tree's shape is only
  // valid under the order it was built with.
  order: number;

  constructor(order: number = 3) {
    this.order = order;
  }

  private maxKeys(): number {
    return this.order - 1;
  }

  private minKeys(): number {
    return Math.ceil(this.order / 2) - 1;
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

    this.insertRec(this.root, value);

    if (this.root.keys.length > this.maxKeys()) {
      const newRoot = new BTreeNode<T>();
      newRoot.leaf = false;
      newRoot.children = [this.root];
      this.splitChild(newRoot, 0);
      this.root = newRoot;
    }

    return true;
  }

  private insertRec(node: BTreeNode<T>, value: T): void {
    if (node.leaf) {
      let i = node.keys.length - 1;
      while (i >= 0 && value < node.keys[i]) i--;
      node.keys.splice(i + 1, 0, value);
      return;
    }

    let i = node.keys.length - 1;
    while (i >= 0 && value < node.keys[i]) i--;
    i++;

    this.insertRec(node.children[i], value);

    if (node.children[i].keys.length > this.maxKeys()) {
      this.splitChild(node, i);
    }
  }

  // Splits `parent.children[index]`, which holds exactly one more key
  // than allowed, promoting its middle key up into `parent`.
  private splitChild(parent: BTreeNode<T>, index: number): void {
    const fullChild = parent.children[index];
    const midIndex = Math.floor(fullChild.keys.length / 2);
    const newChild = new BTreeNode<T>();
    newChild.leaf = fullChild.leaf;

    const midKey = fullChild.keys[midIndex];
    newChild.keys = fullChild.keys.slice(midIndex + 1);
    fullChild.keys = fullChild.keys.slice(0, midIndex);

    if (!fullChild.leaf) {
      newChild.children = fullChild.children.slice(midIndex + 1);
      fullChild.children = fullChild.children.slice(0, midIndex + 1);
    }

    parent.children.splice(index + 1, 0, newChild);
    parent.keys.splice(index, 0, midKey);
  }

  delete(value: T): void {
    if (!this.root) return;
    this.deleteRec(this.root, value);
    if (this.root.keys.length === 0) {
      this.root = this.root.leaf ? null : this.root.children[0];
    }
  }

  private findKeyIndex(node: BTreeNode<T>, value: T): number {
    let idx = 0;
    while (idx < node.keys.length && node.keys[idx] < value) idx++;
    return idx;
  }

  private getPredecessor(node: BTreeNode<T>, idx: number): T {
    let current = node.children[idx];
    while (!current.leaf) current = current.children[current.children.length - 1];
    return current.keys[current.keys.length - 1];
  }

  private deleteRec(node: BTreeNode<T>, value: T): void {
    const idx = this.findKeyIndex(node, value);

    if (idx < node.keys.length && node.keys[idx] === value) {
      if (node.leaf) {
        node.keys.splice(idx, 1);
        return;
      }

      // Swap down to the predecessor leaf, then remove it from there -
      // reduces an internal deletion to the already-handled leaf case.
      const pred = this.getPredecessor(node, idx);
      node.keys[idx] = pred;
      this.deleteRec(node.children[idx], pred);
      this.fixUnderflow(node, idx);
      return;
    }

    if (node.leaf) return; // value not present

    this.deleteRec(node.children[idx], value);
    this.fixUnderflow(node, idx);
  }

  // After deleting from node.children[idx], top it back off if it's now
  // short - by borrowing a key from a sibling, or merging with one.
  private fixUnderflow(node: BTreeNode<T>, idx: number): void {
    const child = node.children[idx];
    if (child.keys.length >= this.minKeys()) return;

    if (idx > 0 && node.children[idx - 1].keys.length > this.minKeys()) {
      this.borrowFromPrev(node, idx);
    } else if (idx < node.children.length - 1 && node.children[idx + 1].keys.length > this.minKeys()) {
      this.borrowFromNext(node, idx);
    } else if (idx < node.children.length - 1) {
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

  // Merges node.children[idx] and node.children[idx+1], plus the
  // separator key between them, into a single node.
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
