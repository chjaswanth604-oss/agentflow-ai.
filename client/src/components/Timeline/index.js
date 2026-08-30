import { useEffect, useState } from 'react';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket';
import { Bot, CheckCircle2, AlertTriangle, ShieldAlert, Cpu, Activity, Clock } from 'lucide-react';
import api from '../../services/api';

const agentBadges = {
  planner: { label: 'Planner Agent', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Cpu },
  execution: { label: 'Execution Agent', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Bot },
  validation: { label: 'Validation Agent', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
  recovery: { label: 'Recovery Agent', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: ShieldAlert },
  monitoring: { label: 'Monitoring Agent', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Activity }
};

export default function Timeline({ executionId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!executionId) return;

    // Fetch initial log history
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/executions/${executionId}/timeline`);
        setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Socket real-time event listener
    joinExecutionRoom(executionId);
    const socket = getSocket();

    if (socket) {
      socket.on('agent_event', (eventData) => {
        setLogs((prev) => [...prev, eventData]);
      });
    }

    return () => {
      leaveExecutionRoom(executionId);
    };
  }, [executionId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading execution timeline...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No agent events recorded yet for this execution run.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {logs.map((log, index) => {
        const agentInfo = agentBadges[log.agent] || agentBadges.monitoring;
        const Icon = agentInfo.icon;
        return (
          <div
            key={log._id || index}
            className="flex items-start gap-3 bg-[#131B29]/70 border border-slate-800/80 rounded-xl p-3 shadow-sm hover:border-slate-700 transition"
          >
            {/* Timeline Icon Badge */}
            <div className={`p-2 rounded-lg border ${agentInfo.color} shrink-0 mt-0.5`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${agentInfo.color}`}>
                  {agentInfo.label}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs text-slate-200 font-medium leading-relaxed">{log.message}</p>

              {/* Metadata inspector pill if metadata exists */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[10px] text-indigo-300 overflow-x-auto">
                  <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
