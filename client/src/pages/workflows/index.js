import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';
import { GitFork, Search, Plus, Play, Copy, Trash2, Edit3, Sparkles, Filter } from 'lucide-react';

export default function WorkflowsList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/workflows', { params });
      setWorkflows(res.workflows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [search, statusFilter]);

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/workflows/${id}/duplicate`);
      fetchWorkflows();
    } catch (err) {
      alert(err.message || 'Duplicate failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleTriggerRun = async (id) => {
    try {
      const res = await api.post(`/workflows/${id}/execute`, { inputs: {} });
      alert(`Triggered execution ID: ${res.data._id}`);
    } catch (err) {
      alert(err.message || 'Execution trigger failed');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Workflows Library">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Automation Workflows</h1>
              <p className="text-xs text-slate-400">Manage, configure, and trigger visual automation graphs</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/workflows/builder"
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> AI Builder
              </Link>
              <Link
                href="/workflows/new"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const created = await api.post('/workflows', {
                      name: 'New Custom Automation',
                      description: 'Operator configured visual graph',
                      nodes: [],
                      edges: []
                    });
                    window.location.href = `/workflows/${created.data._id}`;
                  } catch (err) {
                    alert(err.message);
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Manual Workflow
              </Link>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#131B29] p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search workflows by title or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0B0F17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Workflows Grid */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-[#131B29] border border-slate-800 rounded-2xl">
              No workflows found. Create a custom workflow or use the AI builder!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  className="bg-[#131B29] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        {wf.status || 'draft'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">v{wf.version || 1}</span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base group-hover:text-indigo-300 transition">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{wf.description || 'No description provided.'}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      {wf.nodes?.length || 0} node(s) | {wf.edges?.length || 0} connection(s)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTriggerRun(wf._id)}
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                        title="Trigger Execution Run"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(wf._id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Duplicate Workflow"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/workflows/${wf._id}`}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                        title="Edit Canvas"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(wf._id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                        title="Delete Workflow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
