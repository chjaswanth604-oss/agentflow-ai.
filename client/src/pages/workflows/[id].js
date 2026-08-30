import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import NodePalette from '../../components/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import api from '../../services/api';
import { Play, Save, GitFork, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function WorkflowEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { activeWorkflow, setWorkflow, nodes, edges } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchWorkflow = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/workflows/${id}`);
        setWorkflow(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [id, setWorkflow]);

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await api.put(`/workflows/${id}`, {
        nodes,
        edges
      });
      alert('Workflow graph saved successfully!');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    try {
      setExecuting(true);
      // Auto-save graph before executing
      await api.put(`/workflows/${id}`, { nodes, edges });
      const res = await api.post(`/workflows/${id}/execute`, { inputs: {} });
      const executionId = res.data._id;
      router.push(`/executions/${executionId}`);
    } catch (err) {
      alert(err.message || 'Execution trigger failed');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Workflow Editor">
          <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-slate-400 text-xs">
            Loading workflow graph...
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell title={activeWorkflow?.name || 'Workflow Canvas'}>
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
          {/* Canvas Top Bar */}
          <div className="h-12 border-b border-slate-800 bg-[#131B29] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/workflows')}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  {activeWorkflow?.name}
                  <span className="text-[10px] text-slate-400 font-mono">v{activeWorkflow?.version || 1}</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                {saving ? 'Saving...' : 'Save Graph'}
              </button>
              <button
                onClick={handleExecute}
                disabled={executing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                {executing ? 'Executing...' : 'Run Workflow'}
              </button>
            </div>
          </div>

          {/* Canvas Workspace: Left Palette + Canvas + Right Config Panel */}
          <div className="flex-1 flex overflow-hidden">
            <NodePalette />
            <WorkflowCanvas />
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
