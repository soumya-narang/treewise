import { TreeNode } from './TreeNode';

export class BinarySearchTree<T> {
  root: TreeNode<T> | null = null;

  insert(value: T): void {
    const newNode = new TreeNode(value);
    if (!this.root) {
      this.root = newNode;
      return;
    }

    let current = this.root;
    while (true) {
      if (value < current.value) {
        if (current.left === null) {
          current.left = newNode;
          return;
        }
        current = current.left;
      } else if (value > current.value) {
        if (current.right === null) {
          current.right = newNode;
          return;
        }
        current = current.right;
      } else {
        // Value already exists (ignore duplicates for simplicity)
        return;
      }
    }
  }

  delete(value: T): void {
    this.root = this.deleteNode(this.root, value);
  }

  private deleteNode(node: TreeNode<T> | null, value: T): TreeNode<T> | null {
    if (!node) return null;

    if (value < node.value) {
      node.left = this.deleteNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.deleteNode(node.right, value);
    } else {
      // Node to delete found
      if (!node.left && !node.right) return null;
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      // Node has two children: find min in right subtree
      let minNode = node.right;
      while (minNode.left) {
        minNode = minNode.left;
      }
      
      // Swap value and id to maintain node identity conceptually 
      // but standard approach is just to replace the value
      const tempId = node.id;
      node.value = minNode.value;
      node.id = minNode.id; // Keep the id of the node we're conceptually moving up
      minNode.id = tempId; // So it animates correctly
      
      node.right = this.deleteNode(node.right, minNode.value);
    }
    return node;
  }

  public rotateLeft(value: T): void {
    this.root = this._rotateLeft(this.root, value);
  }

  private _rotateLeft(node: TreeNode<T> | null, value: T): TreeNode<T> | null {
    if (!node) return null;
    
    if (value < node.value) {
      node.left = this._rotateLeft(node.left, value);
      return node;
    } else if (value > node.value) {
      node.right = this._rotateLeft(node.right, value);
      return node;
    } else {
      if (!node.right) return node; // Cannot rotate left without a right child
      const newRoot = node.right;
      node.right = newRoot.left;
      newRoot.left = node;
      return newRoot;
    }
  }

  public rotateRight(value: T): void {
    this.root = this._rotateRight(this.root, value);
  }

  private _rotateRight(node: TreeNode<T> | null, value: T): TreeNode<T> | null {
    if (!node) return null;

    if (value < node.value) {
      node.left = this._rotateRight(node.left, value);
      return node;
    } else if (value > node.value) {
      node.right = this._rotateRight(node.right, value);
      return node;
    } else {
      if (!node.left) return node; // Cannot rotate right without a left child
      const newRoot = node.left;
      node.left = newRoot.right;
      newRoot.right = node;
      return newRoot;
    }
  }

  public isValidChain(values: T[]): boolean {
    if (values.length !== 3) return false;
    
    const nodesInfo: { node: TreeNode<T>, depth: number }[] = [];
    for (const val of values) {
      let current = this.root;
      let depth = 0;
      while (current) {
        if (val === current.value) {
          nodesInfo.push({ node: current, depth });
          break;
        }
        depth++;
        if (val < current.value) current = current.left;
        else current = current.right;
      }
    }
    
    if (nodesInfo.length !== 3) return false;
    nodesInfo.sort((a, b) => a.depth - b.depth);
    
    const Z = nodesInfo[0].node;
    const Y = nodesInfo[1].node;
    const X = nodesInfo[2].node;
    
    return (Z.left === Y || Z.right === Y) && (Y.left === X || Y.right === X);
  }

  public performAdvancedRotation(values: T[], type: 'LL' | 'RR' | 'LR' | 'RL'): boolean {
    if (!this.isValidChain(values)) return false;

    const nodesInfo: { node: TreeNode<T>, depth: number }[] = [];
    for (const val of values) {
      let current = this.root;
      let depth = 0;
      while (current) {
        if (val === current.value) {
          nodesInfo.push({ node: current, depth });
          break;
        }
        depth++;
        if (val < current.value) current = current.left;
        else current = current.right;
      }
    }
    
    nodesInfo.sort((a, b) => a.depth - b.depth);
    const Z = nodesInfo[0].node;
    const Y = nodesInfo[1].node;

    switch (type) {
      case 'LL':
        this.rotateRight(Z.value);
        break;
      case 'RR':
        this.rotateLeft(Z.value);
        break;
      case 'LR':
        this.rotateLeft(Y.value);
        this.rotateRight(Z.value);
        break;
      case 'RL':
        this.rotateRight(Y.value);
        this.rotateLeft(Z.value);
        break;
    }
    
    return true;
  }
}


