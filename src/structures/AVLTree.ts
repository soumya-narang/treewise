import { TreeNode } from './TreeNode';

export class AVLTree<T> {
  root: TreeNode<T> | null = null;

  private height(node: TreeNode<T> | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: TreeNode<T> | null): number {
    return node ? this.height(node.left) - this.height(node.right) : 0;
  }

  private rightRotate(y: TreeNode<T>): TreeNode<T> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
    x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;

    return x;
  }

  private leftRotate(x: TreeNode<T>): TreeNode<T> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
    y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;

    return y;
  }

  private contains(node: TreeNode<T> | null, value: T): boolean {
    if (!node) return false;
    if (value === node.value) return true;
    return value < node.value ? this.contains(node.left, value) : this.contains(node.right, value);
  }

  /** Returns true if the value was inserted, false if it was already present. */
  insert(value: T): boolean {
    if (this.contains(this.root, value)) return false;
    this.root = this.insertNode(this.root, value);
    return true;
  }

  private insertNode(node: TreeNode<T> | null, value: T): TreeNode<T> {
    if (!node) return new TreeNode(value);

    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    } else {
      return node; // Duplicates not allowed
    }

    node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
    const balance = this.getBalance(node);

    // Left Left
    if (balance > 1 && value < node.left!.value) {
      return this.rightRotate(node);
    }

    // Right Right
    if (balance < -1 && value > node.right!.value) {
      return this.leftRotate(node);
    }

    // Left Right
    if (balance > 1 && value > node.left!.value) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }

    // Right Left
    if (balance < -1 && value < node.right!.value) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  delete(value: T): void {
    this.root = this.deleteNode(this.root, value);
  }

  private deleteNode(node: TreeNode<T> | null, value: T): TreeNode<T> | null {
    if (!node) return node;

    if (value < node.value) {
      node.left = this.deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.deleteNode(node.right, value);
    } else {
      if (!node.left || !node.right) {
        let temp = node.left ? node.left : node.right;
        if (!temp) {
          temp = node;
          node = null;
        } else {
          node = temp;
        }
      } else {
        let temp = node.right;
        while (temp.left) temp = temp.left;
        
        const tempId = node.id;
        node.value = temp.value;
        node.id = temp.id;
        temp.id = tempId;
        
        node.right = this.deleteNode(node.right, temp.value);
      }
    }

    if (!node) return node;

    node.height = Math.max(this.height(node.left), this.height(node.right)) + 1;
    const balance = this.getBalance(node);

    if (balance > 1 && this.getBalance(node.left) >= 0) {
      return this.rightRotate(node);
    }

    if (balance > 1 && this.getBalance(node.left) < 0) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }

    if (balance < -1 && this.getBalance(node.right) <= 0) {
      return this.leftRotate(node);
    }

    if (balance < -1 && this.getBalance(node.right) > 0) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }
}
