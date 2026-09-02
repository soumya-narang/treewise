import { TreeNode } from './TreeNode';

/**
 * A standard CLRS-style red-black tree, using `null` children as implicit
 * black leaves (no sentinel node) and explicit `parent` pointers on
 * TreeNode so rotations and the insert/delete fixups can walk upward.
 * Both fixups are the textbook algorithms:
 *   - insert: BST insert, color the new node red, then re-balance by
 *     recoloring / rotating up from the new node until the red-red
 *     violation (if any) is resolved and the root is forced black.
 *   - delete: BST delete (splicing in the in-order successor when the
 *     target has two children), then if a black node was removed,
 *     push the resulting "double-black" deficit up via recoloring /
 *     rotations until it's absorbed.
 */
export class RedBlackTree<T> {
  root: TreeNode<T> | null = null;

  private isRed(node: TreeNode<T> | null): boolean {
    return node !== null && node.color === 'RED';
  }

  private rotateLeft(x: TreeNode<T>): void {
    const y = x.right!;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  private rotateRight(x: TreeNode<T>): void {
    const y = x.left!;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }

  /** Returns true if the value was inserted, false if it was already present. */
  insert(value: T): boolean {
    let parent: TreeNode<T> | null = null;
    let current = this.root;
    while (current) {
      if (value === current.value) return false;
      parent = current;
      current = value < current.value ? current.left : current.right;
    }

    const z = new TreeNode(value);
    z.color = 'RED';
    z.parent = parent;

    if (!parent) this.root = z;
    else if (value < parent.value) parent.left = z;
    else parent.right = z;

    this.insertFixup(z);
    return true;
  }

  private insertFixup(z: TreeNode<T>): void {
    while (this.isRed(z.parent)) {
      const parent = z.parent!;
      const grandparent = parent.parent!;

      if (parent === grandparent.left) {
        const uncle = grandparent.right;
        if (this.isRed(uncle)) {
          parent.color = 'BLACK';
          uncle!.color = 'BLACK';
          grandparent.color = 'RED';
          z = grandparent;
        } else {
          if (z === parent.right) {
            z = parent;
            this.rotateLeft(z);
          }
          z.parent!.color = 'BLACK';
          z.parent!.parent!.color = 'RED';
          this.rotateRight(z.parent!.parent!);
        }
      } else {
        const uncle = grandparent.left;
        if (this.isRed(uncle)) {
          parent.color = 'BLACK';
          uncle!.color = 'BLACK';
          grandparent.color = 'RED';
          z = grandparent;
        } else {
          if (z === parent.left) {
            z = parent;
            this.rotateRight(z);
          }
          z.parent!.color = 'BLACK';
          z.parent!.parent!.color = 'RED';
          this.rotateLeft(z.parent!.parent!);
        }
      }
    }
    this.root!.color = 'BLACK';
  }

  private transplant(u: TreeNode<T>, v: TreeNode<T> | null): void {
    if (!u.parent) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    if (v) v.parent = u.parent;
  }

  private minimum(node: TreeNode<T>): TreeNode<T> {
    let current = node;
    while (current.left) current = current.left;
    return current;
  }

  delete(value: T): void {
    let z = this.root;
    while (z && z.value !== value) {
      z = value < z.value ? z.left : z.right;
    }
    if (!z) return;

    let y = z;
    let yOriginalColor = y.color!;
    let x: TreeNode<T> | null;
    let xParent: TreeNode<T> | null;

    if (!z.left) {
      x = z.right;
      xParent = z.parent;
      this.transplant(z, z.right);
    } else if (!z.right) {
      x = z.left;
      xParent = z.parent;
      this.transplant(z, z.left);
    } else {
      y = this.minimum(z.right);
      yOriginalColor = y.color!;
      x = y.right;
      if (y.parent === z) {
        xParent = y;
      } else {
        xParent = y.parent;
        this.transplant(y, y.right);
        y.right = z.right;
        y.right!.parent = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      y.left!.parent = y;
      y.color = z.color;
    }

    if (yOriginalColor === 'BLACK') {
      this.deleteFixup(x, xParent);
    }
  }

  private deleteFixup(x: TreeNode<T> | null, parent: TreeNode<T> | null): void {
    while (x !== this.root && !this.isRed(x)) {
      if (!parent) break;
      if (x === parent.left) {
        let sibling = parent.right!;
        if (this.isRed(sibling)) {
          sibling.color = 'BLACK';
          parent.color = 'RED';
          this.rotateLeft(parent);
          sibling = parent.right!;
        }
        if (!this.isRed(sibling.left) && !this.isRed(sibling.right)) {
          sibling.color = 'RED';
          x = parent;
          parent = x.parent;
        } else {
          if (!this.isRed(sibling.right)) {
            if (sibling.left) sibling.left.color = 'BLACK';
            sibling.color = 'RED';
            this.rotateRight(sibling);
            sibling = parent.right!;
          }
          sibling.color = parent.color;
          parent.color = 'BLACK';
          if (sibling.right) sibling.right.color = 'BLACK';
          this.rotateLeft(parent);
          x = this.root;
          parent = null;
        }
      } else {
        let sibling = parent.left!;
        if (this.isRed(sibling)) {
          sibling.color = 'BLACK';
          parent.color = 'RED';
          this.rotateRight(parent);
          sibling = parent.left!;
        }
        if (!this.isRed(sibling.right) && !this.isRed(sibling.left)) {
          sibling.color = 'RED';
          x = parent;
          parent = x.parent;
        } else {
          if (!this.isRed(sibling.left)) {
            if (sibling.right) sibling.right.color = 'BLACK';
            sibling.color = 'RED';
            this.rotateLeft(sibling);
            sibling = parent.left!;
          }
          sibling.color = parent.color;
          parent.color = 'BLACK';
          if (sibling.left) sibling.left.color = 'BLACK';
          this.rotateRight(parent);
          x = this.root;
          parent = null;
        }
      }
    }
    if (x) x.color = 'BLACK';
  }
}
