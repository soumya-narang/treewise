export class TreeNode<T> {
  value: T;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;
  height: number = 1; // Used for AVL

  // A stable unique identifier to allow React to animate node movements smoothly
  id: string;

  constructor(value: T) {
    this.value = value;
    this.id = Math.random().toString(36).substring(2, 11);
  }

  clone(): TreeNode<T> {
    const newNode = new TreeNode<T>(this.value);
    newNode.id = this.id;
    newNode.height = this.height;
    if (this.left) newNode.left = this.left.clone();
    if (this.right) newNode.right = this.right.clone();
    return newNode;
  }
}
