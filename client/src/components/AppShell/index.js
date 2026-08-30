import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Bot,
  LayoutDashboard,
  GitFork,
  PlayCircle,
  Link2,
  Settings,
  Sparkles,
  LogOut,
  Bell,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationsDrawer from '../Notifications';

export default function AppShell({ children, title = 'Dashboard' }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Generator', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
    { label: 'Workflows', href: '/workflows', icon: GitFork },
    { label: 'Executions', href: '/executions', icon: PlayCircle },
    { label: 'Integrations', href: '/integrations', icon: Link2 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-[#131B29]/90 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-white group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Agentflow<span className="text-indigo-400 font-extrabold">_AI</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center text-slate-500 text-xs gap-1 ml-4 pl-4 border-l border-slate-800">
            <span>Platform</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300 font-medium">{title}</span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNotifOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 relative transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-indigo-400">
              {mounted && user?.name ? user.name.substring(0, 2).toUpperCase() : 'OP'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-semibold text-slate-200">{mounted && user?.name ? user.name : 'Operator'}</p>
              <p className="text-[10px] text-indigo-400 capitalize">{mounted && user?.role ? user.role : 'Operator'}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition ml-1"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-60 border-r border-slate-800/80 bg-[#0F172A]/50 p-3 hidden md:flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.2 font-semibold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick System Badge */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px]">Engine Status</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </span>
            </div>
            <p className="text-[10px] text-slate-500">5-Agent Chain Engine Ready</p>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-[#0B0F17]">
          {children}
        </main>
      </div>

      <NotificationsDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
}
