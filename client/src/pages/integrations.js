import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../services/api';
import { Link2, Mail, MessageSquare, Bot, Table, CheckCircle2, XCircle, RefreshCw, Key } from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualModal, setManualModal] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      setIntegrations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleOAuthConnect = async (provider) => {
    const googleConsentUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=339086884724-l9ecbh9aoqlq3mbocj9b84sll92huiao.apps.googleusercontent.com&redirect_uri=${encodeURIComponent('https://agentflow-ai-0u7r.onrender.com/api/integrations/oauth/google/callback')}&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file')}&access_type=offline&prompt=consent`;

    try {
      const response = await api.get(`/integrations/oauth/${provider}/start`);
      const targetUrl = response.data?.url || response.data?.data?.url || googleConsentUrl;
      window.location.href = targetUrl;
    } catch (err) {
      window.location.href = googleConsentUrl;
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider} integration?`)) return;
    try {
      await api.delete(`/integrations/${provider}`);
      fetchIntegrations();
    } catch (err) {
      alert(err.message || 'Disconnect failed');
    }
  };

  const handleSaveManualKey = async (provider) => {
    try {
      await api.post('/integrations', { provider, apiKey: apiKeyInput, botToken: apiKeyInput });
      alert(`Credentials saved for ${provider}`);
      setManualModal(null);
      setApiKeyInput('');
      fetchIntegrations();
    } catch (err) {
      alert(err.message || 'Saving credentials failed');
    }
  };

  const providers = [
    { id: 'gmail', name: 'Gmail', icon: Mail, desc: 'Send & read automated emails', color: 'text-red-400 border-red-500/30' },
    { id: 'slack', name: 'Slack', icon: MessageSquare, desc: 'Post channel notifications & alerts', color: 'text-purple-400 border-purple-500/30' },
    { id: 'discord', name: 'Discord', icon: Bot, desc: 'Post community bot updates', color: 'text-blue-400 border-blue-500/30' },
    { id: 'google-sheets', name: 'Google Sheets', icon: Table, desc: 'Append rows & read spreadsheet data', color: 'text-emerald-400 border-emerald-500/30' },
    { id: 'openrouter', name: 'OpenRouter API', icon: Link2, desc: 'Primary AI model generator API key', color: 'text-indigo-400 border-indigo-500/30' },
    { id: 'gemini', name: 'Google Gemini', icon: Link2, desc: 'Fallback AI model generator API key', color: 'text-cyan-400 border-cyan-500/30' },
  ];

  return (
    <ProtectedRoute>
      <AppShell title="Integrations & OAuth">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-100">Third-Party OAuth & Service Integrations</h1>
            <p className="text-xs text-slate-400">
              Manage external service credentials encrypted at rest using AES-256 (CREDENTIAL_ENCRYPTION_KEY).
            </p>
          </div>

          {/* Integrations Grid */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading integration health status...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((p) => {
                const Icon = p.icon;
                const activeInState = integrations.find((i) => i.provider === p.id);
                const isConnected = activeInState?.isConnected;

                return (
                  <div
                    key={p.id}
                    className="bg-[#131B29] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl border ${p.color} bg-slate-900`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                            isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-500" /> Disconnected
                            </>
                          )}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-100 text-base">{p.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <button
                            onClick={() => handleOAuthConnect(p.id)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Reconnect
                          </button>
                          <button
                            onClick={() => handleDisconnect(p.id)}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl border border-red-500/30 transition"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOAuthConnect(p.id)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 shadow"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Connect OAuth
                          </button>
                          <button
                            onClick={() => setManualModal(p.id)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                            title="Manual Key Setup"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual Credential Modal */}
          {manualModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#131B29] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-slate-100 text-base">Setup Credentials: {manualModal}</h3>
                <p className="text-xs text-slate-400">Enter Bot Token or API Key. Saved values will be encrypted at rest.</p>

                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste Token / API Key here..."
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setManualModal(null)}
                    className="px-4 py-2 text-xs bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveManualKey(manualModal)}
                    className="px-4 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
