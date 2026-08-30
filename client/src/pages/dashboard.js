import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import MetricGrid from '../components/MetricGrid';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Sparkles, GitFork, PlayCircle, Plus, ArrowUpRight, Activity, Bot, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workflows/dashboard');
      setStats(res.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Listen to global Socket.IO agent events for live activity stream
    const socket = getSocket();
    if (socket) {
      socket.on('global_agent_event', (eventData) => {
        setLiveEvents((prev) => [eventData, ...prev.slice(0, 19)]);
      });
    }
  }, []);

  return (
    <ProtectedRoute>
      <AppShell title="Dashboard Console">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Operations Console</h1>
              <p className="text-xs text-slate-400">Monitor multi-agent execution pipeline & automation stats</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/workflows/builder"
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> AI Workflow Builder
              </Link>
              <Link
                href="/workflows"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
              >
                <Plus className="w-4 h-4" /> New Workflow
              </Link>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <MetricGrid metrics={stats?.metrics} />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Executions Summary */}
            <div className="lg:col-span-2 bg-[#131B29] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-slate-100 text-sm">Recent Execution Runs</h3>
                </div>
                <Link
                  href="/executions"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                >
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-500 text-xs">Loading execution history...</div>
              ) : !stats?.recentExecutions || stats.recentExecutions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No executions recorded yet.{' '}
                  <Link href="/workflows/builder" className="text-indigo-400 underline">
                    Run an AI prompt
                  </Link>{' '}
                  to trigger your first execution.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.recentExecutions.map((run) => (
                    <Link
                      key={run._id}
                      href={`/executions/${run._id}`}
                      className="p-3 rounded-xl border border-slate-800/80 bg-[#0F172A]/60 hover:bg-[#1E293B] hover:border-slate-700 transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            run.status === 'COMPLETED'
                              ? 'bg-emerald-400'
                              : run.status === 'RUNNING'
                              ? 'bg-blue-400 animate-ping'
                              : run.status === 'FAILED'
                              ? 'bg-rose-400'
                              : 'bg-amber-400'
                          }`}
                        ></span>
                        <div>
                          <p className="font-medium text-slate-200">{run.workflowId?.name || 'Unnamed Workflow'}</p>
                          <p className="text-[10px] text-slate-500">ID: {run._id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            run.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : run.status === 'RUNNING'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : run.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {run.status}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(run.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Live Socket.IO Activity Stream */}
            <div className="bg-[#131B29] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-slate-100 text-sm">Live Agent Activity</h3>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Streaming
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 pr-1">
                {liveEvents.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Waiting for live 5-agent execution events...
                  </div>
                ) : (
                  liveEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-800/60 bg-[#0F172A]/70 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-indigo-300 uppercase">{evt.agent} Agent</span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium leading-normal">{evt.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
