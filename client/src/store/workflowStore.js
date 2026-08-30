import { create } from 'zustand';

export const useWorkflowStore = create((set, get) => ({
  activeWorkflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isExecuting: false,
  activeExecution: null,

  setWorkflow: (workflow) => {
    set({
      activeWorkflow: workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNode: null
    });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set((state) => {
      // Basic position/selection change handler for React Flow compatibility
      let updatedNodes = [...state.nodes];
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          updatedNodes = updatedNodes.map(n => n.id === change.id ? { ...n, position: change.position } : n);
        }
      });
      return { nodes: updatedNodes };
    });
  },

  selectNode: (node) => set({ selectedNode: node }),

  addNode: (newNode) => {
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode
    }));
  },

  updateNodeConfig: (nodeId, configData) => {
    set((state) => {
      const updatedNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              config: { ...n.data.config, ...configData }
            }
          };
        }
        return n;
      });
      const selected = updatedNodes.find((n) => n.id === nodeId) || state.selectedNode;
      return { nodes: updatedNodes, selectedNode: selected };
    });
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode
    }));
  },

  addEdge: (newEdge) => {
    set((state) => ({
      edges: [...state.edges, newEdge]
    }));
  },

  setExecutionState: (isExecuting, execution = null) => {
    set({ isExecuting, activeExecution: execution });
  }
}));
