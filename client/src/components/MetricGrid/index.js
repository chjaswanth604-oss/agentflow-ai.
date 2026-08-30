import { GitFork, PlayCircle, CheckCircle2, XCircle, Activity, Zap } from 'lucide-react';

export default function MetricGrid({ metrics }) {
  const cards = [
    {
      title: 'Total Workflows',
      value: metrics?.totalWorkflows || 0,
      subtext: `${metrics?.activeWorkflows || 0} active in production`,
      icon: GitFork,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'Total Executions',
      value: metrics?.totalExecutions || 0,
      subtext: `${metrics?.runningExecutions || 0} currently executing`,
      icon: PlayCircle,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Success Rate',
      value: `${metrics?.successRate ?? 100}%`,
      subtext: `${metrics?.successfulExecutions || 0} completed successfully`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Failed Runs',
      value: metrics?.failedExecutions || 0,
      subtext: 'Auto-recovery & escalation logged',
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl border ${card.bg} backdrop-blur flex items-center justify-between shadow-sm transition hover:border-slate-700`}
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{card.value}</h3>
              <p className="text-[11px] text-slate-400 mt-1">{card.subtext}</p>
            </div>
            <div className={`p-3 rounded-lg bg-slate-900/60 border border-slate-800 ${card.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
