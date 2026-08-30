import { useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../services/api';
import { Sparkles, ArrowRight, Bot, CheckCircle2, GitFork, Play } from 'lucide-react';

export default function AIWorkflowBuilder() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('When an invoice PDF arrives, process data with AI, send Gmail notification to finance, post alert to Slack #ops channel, and append row to Google Sheet.');
  const [generating, setGenerating] = useState(false);
  const [generatedGraph, setGeneratedGraph] = useState(null);

  const samplePrompts = [
    'When an invoice arrives via email, run AI summary, post to Slack, and append row to Google Sheet.',
    'Monitor customer support tickets, analyze sentiment with AI model, and trigger Discord bot alert.',
    'On new user signup event, send welcome Gmail and record timestamp in Google Sheets log.'
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setGenerating(true);
      const res = await api.post('/workflows/generate', { prompt });
      setGeneratedGraph(res.data);
    } catch (err) {
      alert(err.message || 'Workflow generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenInCanvas = async () => {
    if (!generatedGraph) return;

    try {
      const res = await api.post('/workflows', {
        name: generatedGraph.name || 'AI Generated Automation',
        description: generatedGraph.description || `Generated from prompt: ${prompt}`,
        nodes: generatedGraph.nodes || [],
        edges: generatedGraph.edges || []
      });

      router.push(`/workflows/${res.data._id}`);
    } catch (err) {
      alert(err.message || 'Failed to save generated graph');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="AI Prompt Builder">
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prompt-to-Workflow AI Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Describe Your Automation</h1>
            <p className="text-xs text-slate-400">
              Type your workflow requirements in plain English. The AI engine constructs nodes, connections, and configurations automatically.
            </p>
          </div>

          {/* Prompt Input Panel */}
          <div className="bg-[#131B29] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-2">Automation Prompt</label>
                <textarea
                  rows={4}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. When an email is received, analyze with AI, post to Slack channel #alerts, and save row to Google Sheet..."
                  className="w-full bg-[#0B0F17] border border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-xs text-slate-100 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Sample Prompts Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium block">Or try a sample prompt:</span>
                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(p)}
                      className="text-[11px] bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700/80 text-slate-300 px-3 py-1.5 rounded-lg transition text-left"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating Graph...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Workflow Graph <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Graph Preview Panel */}
          {generatedGraph && (
            <div className="bg-[#131B29] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-slate-100 text-base">{generatedGraph.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{generatedGraph.description}</p>
                </div>
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Engine: {generatedGraph.generatorUsed}
                </span>
              </div>

              {/* Node List Preview */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Generated Graph Nodes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(generatedGraph.nodes || []).map((node, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-slate-800 bg-[#0B0F17]/80 flex items-center gap-3 text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{node.data?.label || node.id}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{node.type} ({node.data?.provider})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleOpenInCanvas}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <GitFork className="w-4 h-4" /> Open & Edit on Visual Canvas <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
