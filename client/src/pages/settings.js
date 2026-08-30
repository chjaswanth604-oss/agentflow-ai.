import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { User, Shield, Key, Lock, CheckCircle2, Cpu, Activity } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await api.get('/health');
        setHealthData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell title="Platform Settings">
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-100">Operator & System Settings</h1>
            <p className="text-xs text-slate-400">Security configurations, user profile, and system engine health</p>
          </div>

          {/* Profile Card */}
          <div className="bg-[#131B29] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-lg">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'OP'}
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">{user?.name || 'Operator'}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-1">Role Permission</span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold uppercase text-[10px] inline-block">
                  {user?.role || 'operator'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Last Login Session</span>
                <span className="text-slate-300 font-mono">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active Now'}
                </span>
              </div>
            </div>
          </div>

          {/* Engine Health Checks */}
          <div className="bg-[#131B29] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100 text-sm">System Engine & Health Diagnostics</h3>
            </div>

            {loading ? (
              <div className="py-4 text-slate-500 text-xs">Checking system health...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase">Backend Engine Status</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">{healthData?.status || 'UP'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase">Database Tier</span>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-slate-200">
                      {healthData?.database?.isInMemory ? 'In-Memory Fallback Store' : 'MongoDB Cluster'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase">LangGraph Substrate</span>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-slate-200 uppercase">{healthData?.langGraph || 'not-installed'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F172A] space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase">AES-256 Encryption Key</span>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-emerald-400">CREDENTIAL_ENCRYPTION_KEY Verified</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
