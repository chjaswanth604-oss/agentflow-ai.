import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../../store/workflowStore';
import { Zap, Mail, MessageSquare, Bot, Table, Sparkles } from 'lucide-react';

const customNodeTypes = {
  trigger: ({ data }) => (
    <div className="px-4 py-2.5 rounded-xl bg-amber-950/80 border-2 border-amber-500/60 shadow-lg shadow-amber-500/10 flex items-center gap-2.5 min-w-[180px]">
      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
        <Zap className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-amber-200">{data.label}</p>
        <p className="text-[10px] text-amber-400/80">Trigger Event</p>
      </div>
    </div>
  ),
  gmail: ({ data }) => (
    <div className="px-4 py-2.5 rounded-xl bg-red-950/80 border-2 border-red-500/60 shadow-lg shadow-red-500/10 flex items-center gap-2.5 min-w-[180px]">
      <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
        <Mail className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-red-200">{data.label}</p>
        <p className="text-[10px] text-red-400/80">Gmail Integration</p>
      </div>
    </div>
  ),
  slack: ({ data }) => (
    <div className="px-4 py-2.5 rounded-xl bg-purple-950/80 border-2 border-purple-500/60 shadow-lg shadow-purple-500/10 flex items-center gap-2.5 min-w-[180px]">
      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
        <MessageSquare className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-purple-200">{data.label}</p>
        <p className="text-[10px] text-purple-400/80">Slack Integration</p>
      </div>
    </div>
  ),
  discord: ({ data }) => (
    <div className="px-4 py-2.5 rounded-xl bg-blue-950/80 border-2 border-blue-500/60 shadow-lg shadow-blue-500/10 flex items-center gap-2.5 min-w-[180px]">
      <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
        <Bot className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-blue-200">{data.label}</p>
        <p className="text-[10px] text-blue-400/80">Discord Bot Integration</p>
      </div>
    </div>
  ),
  sheets: ({ data }) => (
    <div className="px-4 py-2.5 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10 flex items-center gap-2.5 min-w-[180px]">
      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
        <Table className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-emerald-200">{data.label}</p>
        <p className="text-[10px] text-emerald-400/80">Google Sheets Integration</p>
      </div>
    </div>
  ),
  ai_prompt: ({ data }) => (
    <div className="px-4 py-2.5 rounded-xl bg-indigo-950/80 border-2 border-indigo-500/60 shadow-lg shadow-indigo-500/10 flex items-center gap-2.5 min-w-[180px]">
      <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
        <Sparkles className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-indigo-200">{data.label}</p>
        <p className="text-[10px] text-indigo-400/80">AI Model Generator</p>
      </div>
    </div>
  )
};

export default function WorkflowCanvas() {
  const { nodes, edges, selectNode, onNodesChange, addEdge } = useWorkflowStore();

  const handleNodeClick = useCallback(
    (event, node) => {
      selectNode(node);
    },
    [selectNode]
  );

  const handleConnect = useCallback(
    (params) => {
      const newEdge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        animated: true,
        style: { stroke: '#6366F1', strokeWidth: 2 }
      };
      addEdge(newEdge);
    },
    [addEdge]
  );

  return (
    <div className="flex-1 h-full w-full bg-[#0B0F17] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={customNodeTypes}
        onNodeClick={handleNodeClick}
        onConnect={handleConnect}
        fitView
      >
        <Controls className="!bg-[#131B29] !border-slate-800 !text-slate-300" />
        <MiniMap className="!bg-[#131B29] !border-slate-800" nodeColor="#4F46E5" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1E293B" />
      </ReactFlow>
    </div>
  );
}
