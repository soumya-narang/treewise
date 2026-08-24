import { useState, useEffect, useRef } from 'react';
import './App.css';
import { BinarySearchTree } from './structures/BinarySearchTree';
import { AVLTree } from './structures/AVLTree';
import { computeTreeLayout } from './layout/TreeLayout';
import { TreeCanvas } from './components/TreeCanvas';

type TreeType = 'BST' | 'AVL';

function App() {
  const [treeType, setTreeType] = useState<TreeType>('BST');
  const [bst] = useState(new BinarySearchTree<number>());
  const [avl] = useState(new AVLTree<number>());
  
  // History state for undo/redo
  const [history, setHistory] = useState<{bstRoot: typeof bst.root, avlRoot: typeof avl.root}[]>([{ bstRoot: null, avlRoot: null }]);
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
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;

    if (treeType === 'BST') {
      bst.insert(val);
    } else {
      avl.insert(val);
    }
    
    saveState();
    setInputValue('');
    setUpdateTick(prev => prev + 1);
    showToast(`Inserted ${val}`);
  };

  const handleDelete = () => {
    if (selectedNodeValues.length !== 1) return;
    const val = selectedNodeValues[0];

    if (treeType === 'BST') {
      bst.delete(val);
    } else {
      avl.delete(val);
    }
    
    setSelectedNodeValues([]);
    saveState();
    setUpdateTick(prev => prev + 1);
    showToast(`Deleted ${val}`);
  };
  
  const handleRandomize = () => {
    const vals = Array.from({length: 7}, () => Math.floor(Math.random() * 100));
    if (treeType === 'BST') {
      bst.root = null;
      vals.forEach(v => bst.insert(v));
    } else {
      avl.root = null;
      vals.forEach(v => avl.insert(v));
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
    if (treeType === 'BST') bst.root = null;
    else avl.root = null;
    setSelectedNodeValues([]);
    saveState();
    setUpdateTick(prev => prev + 1);
    showToast('Cleared canvas');
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

  const currentRoot = treeType === 'BST' ? bst.root : avl.root;
  const layout = computeTreeLayout(currentRoot, canvasWidth, 80);
  const canvasHeight = Math.max(600, (layout.nodes.length > 0 ? Math.max(...layout.nodes.map(n => n.y)) : 0) + 120);

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
          </div>
          <div className="big-o-caption">
            {treeType === 'BST' 
              ? 'avg O(log n) lookup · worst O(n) if it grows lopsided' 
              : 'guaranteed O(log n) height · rebalances on every write'}
          </div>
        </div>

        <div className="controls-group">
          <div className="section-header">OPERATIONS</div>
          <form className="input-row" onSubmit={handleInsert}>
            <input 
              type="number" 
              placeholder="Enter number..." 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn">Insert</button>
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
           <button className="btn btn-secondary" onClick={handleRandomize} style={{ marginBottom: '8px', width: '100%' }}>
             Generate Random Tree
           </button>
           <button className="btn btn-secondary" onClick={handleClear} style={{ width: '100%' }}>
             Clear Canvas
           </button>
        </div>

        {toastMessage && (
          <div className="toast" key={toastId}>
            {toastMessage}
          </div>
        )}
      </div>

      <div className="canvas-container" ref={containerRef}>
        <TreeCanvas 
          layout={layout} 
          width={canvasWidth} 
          height={canvasHeight}
          onNodeClick={handleNodeClick}
          selectedNodeValues={selectedNodeValues}
        />
      </div>
    </div>
  );
}

export default App;
