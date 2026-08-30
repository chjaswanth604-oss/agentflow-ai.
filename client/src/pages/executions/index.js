import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';
import { PlayCircle, Clock, CheckCircle2, XCircle, PauseCircle, Filter, ArrowUpRight } from 'lucide-react';

export default function ExecutionsList() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/executions', { params });
      setExecutions(res.executions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [statusFilter]);

  return (
    <ProtectedRoute>
      <AppShell title="Executions Log">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Workflow Executions Audit</h1>
              <p className="text-xs text-slate-400">Full audit timeline of execution runs across the 5-agent engine</p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#131B29] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="RUNNING">RUNNING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Executions Table */}
          <div className="bg-[#131B29] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">Loading execution logs...</div>
            ) : executions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No execution runs recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Execution ID</th>
                      <th className="p-4">Workflow Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Started At</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {executions.map((run) => (
                      <tr key={run._id} className="hover:bg-[#1E293B]/50 transition">
                        <td className="p-4 font-mono text-[11px] text-indigo-300">
                          {run._id}
                        </td>
                        <td className="p-4 font-medium text-slate-200">
                          {run.workflowId?.name || 'Unnamed Workflow'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1 ${
                              run.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : run.status === 'RUNNING'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : run.status === 'FAILED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {run.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                            {run.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                            {run.status === 'PAUSED' && <PauseCircle className="w-3 h-3" />}
                            {run.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-400 text-[11px]">
                          {run.duration ? `${run.duration}ms` : 'In Progress'}
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          {new Date(run.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/executions/${run._id}`}
                            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition"
                          >
                            Inspect Live Timeline <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
