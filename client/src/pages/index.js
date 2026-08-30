import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Bot, Sparkles, Cpu, ShieldAlert, CheckCircle2, ArrowRight, GitFork, PlayCircle, Lock } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="h-20 border-b border-slate-800/80 px-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Agentflow<span className="text-indigo-400 font-black">_AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white transition px-4 py-2"
          >
            Operator Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl w-full mx-auto px-6 pt-16 pb-12 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6 backdrop-blur">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Autonomous AI Operations Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Turn Natural Language Prompts into{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Autonomous Multi-Agent Workflows
          </span>
        </h1>

        <p className="mt-6 text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
          Describe any business automation in plain English. Agentflow_AI constructs visual workflow graphs, executes them across a 5-agent chain, integrates with Gmail, Slack, Discord, & Sheets over OAuth, and streams live event timelines.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-indigo-600/25 flex items-center gap-2 transition"
          >
            Launch Operator Console <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-300 font-semibold text-sm rounded-xl transition"
          >
            View Demo Environment
          </Link>
        </div>

        {/* 5-Agent Orchestration Showcase */}
        <div className="mt-16 w-full grid grid-cols-1 md:grid-cols-5 gap-3 text-left">
          {[
            { name: 'Planner Agent', desc: 'DAG topological ordering & confidence scoring', icon: Cpu, color: 'text-indigo-400 border-indigo-500/30' },
            { name: 'Execution Agent', desc: 'Dispatches steps to OAuth integrations & AI', icon: Bot, color: 'text-blue-400 border-blue-500/30' },
            { name: 'Validation Agent', desc: 'Verifies required output fields & schemas', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/30' },
            { name: 'Recovery Agent', desc: 'Classifies failures & handles backoff retries', icon: ShieldAlert, color: 'text-amber-400 border-amber-500/30' },
            { name: 'Monitoring Agent', desc: 'Streams live Socket.IO audit events & logs', icon: PlayCircle, color: 'text-cyan-400 border-cyan-500/30' },
          ].map((agent, idx) => {
            const Icon = agent.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${agent.color} bg-[#131B29]/60 backdrop-blur shadow-md space-y-2`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <h4 className="text-xs font-bold text-slate-200">{agent.name}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{agent.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Agentflow_AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
