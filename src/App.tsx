import { useState, useEffect, useRef } from 'react';
import './App.css';
import { BinarySearchTree } from './structures/BinarySearchTree';
import { AVLTree } from './structures/AVLTree';
import { HeapTree } from './structures/HeapTree';
import { RedBlackTree } from './structures/RedBlackTree';
import { BTree } from './structures/BTree';
import { computeTreeLayout } from './layout/TreeLayout';
import { computeBTreeLayout } from './layout/BTreeLayout';
import { TreeCanvas } from './components/TreeCanvas';
import { BTreeCanvas } from './components/BTreeCanvas';

type TreeType = 'BST' | 'AVL' | 'MINHEAP' | 'MAXHEAP' | 'RBT' | 'BTREE';

function App() {
  const [treeType, setTreeType] = useState<TreeType>('BST');
  const [bst] = useState(new BinarySearchTree<number>());
  const [avl] = useState(new AVLTree<number>());
  const [minHeap] = useState(new HeapTree<number>('MIN'));
  const [maxHeap] = useState(new HeapTree<number>('MAX'));
  const [rbt] = useState(new RedBlackTree<number>());
  const [btree] = useState(new BTree<number>(2));
  // A B-Tree's order is a structural choice fixed before any insertion -
  // changing it later means rebuilding the tree from scratch - so the UI
  // requires it to be set explicitly at least once before Insert/Randomize
  // are enabled for this tree type.
  const [btreeOrderConfirmed, setBtreeOrderConfirmed] = useState(false);
  const [btreeOrderInput, setBtreeOrderInput] = useState('2');
  
  // History state for undo/redo
  const [history, setHistory] = useState<{
    bstRoot: typeof bst.root;
    avlRoot: typeof avl.root;
    minHeapRoot: typeof minHeap.root;
    maxHeapRoot: typeof maxHeap.root;
    rbtRoot: typeof rbt.root;
    btreeRoot: typeof btree.root;
    btreeOrder: number;
  }[]>([{ bstRoot: null, avlRoot: null, minHeapRoot: null, maxHeapRoot: null, rbtRoot: null, btreeRoot: null, btreeOrder: btree.order }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // We use a counter just to force re-renders when the mutable tree changes
  const [, setUpdateTick] = useState(0);
  
  const [selectedNodeValues, setSelectedNodeValues] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastId, setToastId] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(`> ${msg}`);
    setToastId(prev => prev + 1);
  };

  const saveState = () => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push({
        bstRoot: bst.root ? bst.root.clone() : null,
        avlRoot: avl.root ? avl.root.clone() : null,
        minHeapRoot: minHeap.root ? minHeap.root.clone() : null,
        maxHeapRoot: maxHeap.root ? maxHeap.root.clone() : null,
        rbtRoot: rbt.root ? rbt.root.clone() : null,
        btreeRoot: btree.root ? btree.root.clone() : null,
        btreeOrder: btree.order,
      });
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      bst.root = state.bstRoot ? state.bstRoot.clone() : null;
      avl.root = state.avlRoot ? state.avlRoot.clone() : null;
      minHeap.root = state.minHeapRoot ? state.minHeapRoot.clone() : null;
      maxHeap.root = state.maxHeapRoot ? state.maxHeapRoot.clone() : null;
      rbt.root = state.rbtRoot ? state.rbtRoot.clone() : null;
      btree.order = state.btreeOrder;
      btree.root = state.btreeRoot ? state.btreeRoot.clone() : null;
      setSelectedNodeValues([]);
      setUpdateTick(prev => prev + 1);
      showToast('Undo');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      bst.root = state.bstRoot ? state.bstRoot.clone() : null;
      avl.root = state.avlRoot ? state.avlRoot.clone() : null;
      minHeap.root = state.minHeapRoot ? state.minHeapRoot.clone() : null;
      maxHeap.root = state.maxHeapRoot ? state.maxHeapRoot.clone() : null;
      rbt.root = state.rbtRoot ? state.rbtRoot.clone() : null;
      btree.order = state.btreeOrder;
      btree.root = state.btreeRoot ? state.btreeRoot.clone() : null;
      setSelectedNodeValues([]);
      setUpdateTick(prev => prev + 1);
      showToast('Redo');
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      setCanvasWidth(Math.max(800, containerRef.current.clientWidth));
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasWidth(Math.max(800, containerRef.current.clientWidth));
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInsert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (treeType === 'BTREE' && !btreeOrderConfirmed) {
      showToast('Set the B-Tree order first');
      return;
    }
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;

    let inserted: boolean;
    switch (treeType) {
      case 'BST': inserted = bst.insert(val); break;
      case 'AVL': inserted = avl.insert(val); break;
      case 'MINHEAP': inserted = minHeap.insert(val); break;
      case 'MAXHEAP': inserted = maxHeap.insert(val); break;
      case 'RBT': inserted = rbt.insert(val); break;
      case 'BTREE': inserted = btree.insert(val); break;
    }
    if (!inserted) {
      showToast(`${val} already exists`);
      return;
    }
    
    saveState();
    setInputValue('');
    setUpdateTick(prev => prev + 1);
    showToast(`Inserted ${val}`);
  };

  const handleDelete = () => {
    if (selectedNodeValues.length !== 1) return;
    const val = selectedNodeValues[0];

    switch (treeType) {
      case 'BST': bst.delete(val); break;
      case 'AVL': avl.delete(val); break;
      case 'MINHEAP': minHeap.delete(val); break;
      case 'MAXHEAP': maxHeap.delete(val); break;
      case 'RBT': rbt.delete(val); break;
      case 'BTREE': btree.delete(val); break;
    }
    
    setSelectedNodeValues([]);
    saveState();
    setUpdateTick(prev => prev + 1);
    showToast(`Deleted ${val}`);
  };
  
  const handleRandomize = () => {
    if (treeType === 'BTREE' && !btreeOrderConfirmed) {
      showToast('Set the B-Tree order first');
      return;
    }
    const vals = Array.from({length: 7}, () => Math.floor(Math.random() * 100));
    switch (treeType) {
      case 'BST':
        bst.root = null;
        vals.forEach(v => bst.insert(v));
        break;
      case 'AVL':
        avl.root = null;
        vals.forEach(v => avl.insert(v));
        break;
      case 'MINHEAP':
        minHeap.root = null;
        vals.forEach(v => minHeap.insert(v));
        break;
      case 'MAXHEAP':
        maxHeap.root = null;
        vals.forEach(v => maxHeap.insert(v));
        break;
      case 'RBT':
        rbt.root = null;
        vals.forEach(v => rbt.insert(v));
        break;
      case 'BTREE':
        btree.root = null;
        vals.forEach(v => btree.insert(v));
        break;
    }
    setSelectedNodeValues([]);
    saveState();
    setUpdateTick(prev => prev + 1);
    showToast('Generated random tree');
  };
  
  const handleNodeClick = (value: number) => {
    setSelectedNodeValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), value];
      }
      return [...prev, value];
    });
  };

  const handleClear = () => {
    switch (treeType) {
      case 'BST': bst.root = null; break;
      case 'AVL': avl.root = null; break;
      case 'MINHEAP': minHeap.root = null; break;
      case 'MAXHEAP': maxHeap.root = null; break;
      case 'RBT': rbt.root = null; break;
      case 'BTREE': btree.root = null; break;
    }
    setSelectedNodeValues([]);
    saveState();
    setUpdateTick(prev => prev + 1);
    showToast('Cleared canvas');
  };

  const handleSetBtreeOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const order = parseInt(btreeOrderInput, 10);
    if (isNaN(order) || order < 2) {
      showToast('Order must be a whole number ≥ 2');
      return;
    }
    btree.order = order;
    btree.root = null;
    setBtreeOrderConfirmed(true);
    setSelectedNodeValues([]);
    saveState();
    setUpdateTick(prev => prev + 1);
    showToast(`B-Tree order set to ${order}`);
  };
  
  const handleAdvancedRotate = (type: 'LL' | 'RR' | 'LR' | 'RL') => {
    if (treeType !== 'BST' || selectedNodeValues.length !== 3) return;
    
    const success = bst.performAdvancedRotation(selectedNodeValues, type);
    if (success) {
      setSelectedNodeValues([]); // Auto-deselect on success
      saveState();
      setUpdateTick(prev => prev + 1);
      showToast(`Rotated (${type})`);
    }
  };

  const currentRoot =
    treeType === 'BST' ? bst.root :
    treeType === 'AVL' ? avl.root :
    treeType === 'MINHEAP' ? minHeap.root :
    treeType === 'MAXHEAP' ? maxHeap.root :
    treeType === 'RBT' ? rbt.root : null;
  const layout = computeTreeLayout(currentRoot, canvasWidth, 80);
  const btreeLayout = computeBTreeLayout(treeType === 'BTREE' ? btree.root : null, canvasWidth, 90);
  const canvasHeight = treeType === 'BTREE'
    ? Math.max(600, (btreeLayout.nodes.length > 0 ? Math.max(...btreeLayout.nodes.map(n => n.y)) : 0) + 120)
    : Math.max(600, (layout.nodes.length > 0 ? Math.max(...layout.nodes.map(n => n.y)) : 0) + 120);

  const chainType = treeType === 'BST' && selectedNodeValues.length === 3 ? bst.getChainType(selectedNodeValues) : null;

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="header">
          <div className="logo-row">
            <h1>TreeWise</h1>
            <div className="logo-dot"></div>
          </div>
          <p className="tagline">Binary trees, drawn the way you'd reason about them on a whiteboard.</p>
          <div className="history-controls" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleUndo} 
              disabled={historyIndex <= 0}
              style={{ flex: 1 }}
            >
              ↺
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleRedo} 
              disabled={historyIndex >= history.length - 1}
              style={{ flex: 1 }}
            >
              ↻
            </button>
          </div>
        </div>

        <div className="controls-group">
          <div className="section-header">TREE TYPE</div>
          <div className="tree-selector">
            <button 
              className={treeType === 'BST' ? 'active' : ''} 
              onClick={() => { setTreeType('BST'); setSelectedNodeValues([]); setUpdateTick(t=>t+1); }}
            >
              Binary Search
            </button>
            <button 
              className={treeType === 'AVL' ? 'active' : ''} 
              onClick={() => { setTreeType('AVL'); setSelectedNodeValues([]); setUpdateTick(t=>t+1); }}
            >
              AVL (Balanced)
            </button>
            <button 
              className={treeType === 'MINHEAP' ? 'active' : ''} 
              onClick={() => { setTreeType('MINHEAP'); setSelectedNodeValues([]); setUpdateTick(t=>t+1); }}
            >
              Min Heap
            </button>
            <button 
              className={treeType === 'MAXHEAP' ? 'active' : ''} 
              onClick={() => { setTreeType('MAXHEAP'); setSelectedNodeValues([]); setUpdateTick(t=>t+1); }}
            >
              Max Heap
            </button>
            <button 
              className={treeType === 'RBT' ? 'active' : ''} 
              onClick={() => { setTreeType('RBT'); setSelectedNodeValues([]); setUpdateTick(t=>t+1); }}
            >
              Red-Black
            </button>
            <button 
              className={treeType === 'BTREE' ? 'active' : ''} 
              onClick={() => { setTreeType('BTREE'); setSelectedNodeValues([]); setUpdateTick(t=>t+1); }}
            >
              B-Tree
            </button>
          </div>
          <div className="big-o-caption">
            {treeType === 'BST' && 'avg O(log n) lookup · worst O(n) if it grows lopsided'}
            {treeType === 'AVL' && 'guaranteed O(log n) height · rebalances on every write'}
            {treeType === 'MINHEAP' && 'complete tree · root is always the minimum · O(log n) insert/delete'}
            {treeType === 'MAXHEAP' && 'complete tree · root is always the maximum · O(log n) insert/delete'}
            {treeType === 'RBT' && 'guaranteed O(log n) height · balances via node color, not strict height'}
            {treeType === 'BTREE' && `order t = ${btree.order} · each node holds ${btree.order - 1}-${2 * btree.order - 1} keys · O(log n) height`}
          </div>
        </div>

        {treeType === 'BTREE' && (
          <div className="controls-group">
            <div className="section-header">B-TREE ORDER</div>
            {!btreeOrderConfirmed ? (
              <>
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '13px', color: 'var(--text-main)' }}>
                  Required before inserting: pick the minimum degree (t). Every node will hold t-1 to 2t-1 keys.
                </p>
                <form className="input-row" onSubmit={handleSetBtreeOrder}>
                  <input 
                    type="number" 
                    min={2}
                    placeholder="t ≥ 2"
                    value={btreeOrderInput}
                    onChange={e => setBtreeOrderInput(e.target.value)}
                  />
                  <button type="submit" className="btn">Set Order</button>
                </form>
              </>
            ) : btree.root === null ? (
              <>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: '13px', color: 'var(--primary-color)', fontWeight: 600 }}>
                  t = {btree.order} (max {2 * btree.order - 1} keys/node)
                </p>
                <form className="input-row" onSubmit={handleSetBtreeOrder}>
                  <input 
                    type="number" 
                    min={2}
                    placeholder="New order..." 
                    value={btreeOrderInput}
                    onChange={e => setBtreeOrderInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary">Change</button>
                </form>
              </>
            ) : (
              <>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: '13px', color: 'var(--primary-color)', fontWeight: 600 }}>
                  t = {btree.order} (max {2 * btree.order - 1} keys/node)
                </p>
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Clear the canvas to pick a different order.
                </p>
              </>
            )}
          </div>
        )}

        <div className="controls-group">
          <div className="section-header">OPERATIONS</div>
          <form className="input-row" onSubmit={handleInsert}>
            <input 
              type="number" 
              placeholder="Enter number..." 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn" disabled={treeType === 'BTREE' && !btreeOrderConfirmed}>Insert</button>
          </form>
          <button className="btn btn-danger" onClick={handleDelete} disabled={selectedNodeValues.length !== 1}>
            Delete Selected Node
          </button>
        </div>
        
        {treeType === 'BST' && (
          <div className="controls-group">
            <div className="section-header">SELECTED NODES</div>
            
            {selectedNodeValues.length === 0 && (
              <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '13px', color: 'var(--text-muted)' }}>
                Pick three nodes in a straight line — grandparent, parent, child — to rotate them.
              </p>
            )}

            {(selectedNodeValues.length === 1 || selectedNodeValues.length === 2) && (
              <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '13px', color: 'var(--text-main)' }}>
                {selectedNodeValues.join(', ')} ({3 - selectedNodeValues.length} more needed)
              </p>
            )}

            {selectedNodeValues.length === 3 && (
              chainType ? (
                <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '8px' }}>
                  {selectedNodeValues.join(' -> ')}
                </div>
              ) : (
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: '13px', color: 'var(--danger-color)' }}>
                  Nodes must form a vertical straight line to rotate.
                </p>
              )
            )}
            
            <div className="rotation-grid">
              {(['LL', 'RR', 'LR', 'RL'] as const).map(type => (
                <button 
                  key={type}
                  className={`rotation-btn ${chainType === type ? 'active' : ''}`} 
                  onClick={() => handleAdvancedRotate(type)}
                  disabled={chainType !== type}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="controls-group" style={{ marginTop: 'auto' }}>
           <button 
             className="btn btn-secondary" 
             onClick={handleRandomize} 
             disabled={treeType === 'BTREE' && !btreeOrderConfirmed}
             style={{ marginBottom: '8px', width: '100%' }}
           >
             Generate Random Tree
           </button>
           <button className="btn btn-secondary" onClick={handleClear} style={{ width: '100%' }}>
             Clear Canvas
           </button>
        </div>
      </div>

      <div className="canvas-container" ref={containerRef}>
        {treeType === 'BTREE' ? (
          <BTreeCanvas
            layout={btreeLayout}
            width={canvasWidth}
            height={canvasHeight}
            onKeyClick={handleNodeClick}
            selectedValues={selectedNodeValues}
          />
        ) : (
          <TreeCanvas 
            layout={layout} 
            width={canvasWidth} 
            height={canvasHeight}
            onNodeClick={handleNodeClick}
            selectedNodeValues={selectedNodeValues}
          />
        )}
      </div>

      {toastMessage && (
        <div className="toast" key={toastId}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
