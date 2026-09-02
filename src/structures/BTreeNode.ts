export class BTreeNode<T> {
  keys: T[] = [];
  children: BTreeNode<T>[] = [];
  leaf: boolean = true;
  // A stable unique identifier to allow React to key/animate node rendering
  id: string;

  constructor() {
    this.id = Math.random().toString(36).substring(2, 11);
  }

  clone(): BTreeNode<T> {
    const newNode = new BTreeNode<T>();
    newNode.id = this.id;
    newNode.keys = [...this.keys];
    newNode.leaf = this.leaf;
    newNode.children = this.children.map(c => c.clone());
    return newNode;
  }
}
