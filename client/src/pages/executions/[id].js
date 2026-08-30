import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import Timeline from '../../components/Timeline';
import api from '../../services/api';
import { PlayCircle, Pause, Play, XSquare, ArrowLeft, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SingleExecutionView() {
  const router = useRouter();
  const { id } = router.query;
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExecution = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/executions/${id}`);
      setExecution(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecution();
  }, [id]);

  const handlePause = async () => {
    try {
      setActionLoading(true);
      await api.post(`/executions/${id}/pause`);
      fetchExecution();
    } catch (err) {
      alert(err.message || 'Pause failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      await api.post(`/executions/${id}/resume`);
      fetchExecution();
    } catch (err) {
      alert(err.message || 'Resume failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this execution run?')) return;
    try {
      setActionLoading(true);
      await api.post(`/executions/${id}/cancel`);
      fetchExecution();
    } catch (err) {
      alert(err.message || 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Execution Run Details">
          <div className="p-12 text-center text-slate-500 text-xs">Loading execution data...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell title={`Execution ${id}`}>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/executions')}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition border border-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Execution Run: <span className="font-mono text-indigo-400 text-sm">{id}</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Workflow: <strong className="text-slate-200">{execution?.workflowSnapshot?.name}</strong>
                </p>
              </div>
            </div>

            {/* Execution Control Buttons */}
            <div className="flex items-center gap-2">
              {execution?.status === 'RUNNING' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause Execution
                </button>
              )}

              {execution?.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Resume Execution
                </button>
              )}

              {['RUNNING', 'PAUSED', 'RETRYING'].includes(execution?.status) && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <XSquare className="w-3.5 h-3.5" /> Cancel Execution
                </button>
              )}
            </div>
          </div>

          {/* Execution Metadata Banner */}
          <div className="bg-[#131B29] border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Status</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
                  execution?.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : execution?.status === 'RUNNING'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : execution?.status === 'FAILED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {execution?.status}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Duration</span>
              <span className="font-mono text-slate-200 text-sm">
                {execution?.duration ? `${execution.duration} ms` : 'In Progress...'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Retry Count</span>
              <span className="font-mono text-slate-200 text-sm">{execution?.retryCount || 0}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Current Node</span>
              <span className="font-mono text-indigo-300 text-sm">{execution?.currentNode || 'Done / N/A'}</span>
            </div>
          </div>

          {/* Main Content: Snapshot & Live Agent Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Agent Event Timeline Stream */}
            <div className="lg:col-span-2 bg-[#131B29] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-slate-100 text-sm">5-Agent Live Execution Timeline</h3>
                </div>
                <span className="text-[10px] text-slate-400">Live Socket.IO Sync</span>
              </div>

              <Timeline executionId={id} />
            </div>

            {/* Workflow Snapshot Inspector */}
            <div className="bg-[#131B29] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-slate-100 text-sm">Runtime Workflow Graph</h3>
              <p className="text-xs text-slate-400">Immutable snapshot captured at execution trigger time.</p>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {(execution?.workflowSnapshot?.nodes || []).map((node, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-800 bg-[#0B0F17] text-xs space-y-1"
                  >
                    <p className="font-semibold text-slate-200">{node.data?.label || node.id}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{node.type} ({node.data?.provider})</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
