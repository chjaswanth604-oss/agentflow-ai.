import { useState, useEffect } from 'react';
import { X, Trash2, Save, Sliders, CheckCircle2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const { selectedNode, selectNode, updateNodeConfig, removeNode } = useWorkflowStore();
  const [config, setConfig] = useState({});
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data?.config || {});
      setLabel(selectedNode.data?.label || selectedNode.type);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleChange = (key, value) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    updateNodeConfig(selectedNode.id, updated);
  };

  return (
    <div className="w-80 border-l border-slate-800 bg-[#0F172A]/90 p-4 flex flex-col h-full shrink-0 animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">Configure Node</h3>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Node Info */}
      <div className="py-3 border-b border-slate-800/60 space-y-3">
        <div>
          <label className="text-[11px] text-slate-400 font-medium block mb-1">Node Title</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Type: <strong className="text-slate-200 uppercase">{selectedNode.type}</strong></span>
          <span>ID: <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded text-[10px]">{selectedNode.id}</code></span>
        </div>
      </div>

      {/* Dynamic Fields based on provider/action */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {selectedNode.type === 'gmail' && (
          <>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Recipient (To)</label>
              <input
                type="email"
                value={config.to || ''}
                onChange={(e) => handleChange('to', e.target.value)}
                placeholder="recipient@example.com"
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Email Subject Line"
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Body Text</label>
              <textarea
                rows={3}
                value={config.body || ''}
                onChange={(e) => handleChange('body', e.target.value)}
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        {selectedNode.type === 'slack' && (
          <>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Slack Channel</label>
              <input
                type="text"
                value={config.channel || ''}
                onChange={(e) => handleChange('channel', e.target.value)}
                placeholder="#ops-alerts"
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Message Text</label>
              <textarea
                rows={3}
                value={config.message || ''}
                onChange={(e) => handleChange('message', e.target.value)}
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        {selectedNode.type === 'discord' && (
          <>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Channel ID</label>
              <input
                type="text"
                value={config.channelId || ''}
                onChange={(e) => handleChange('channelId', e.target.value)}
                placeholder="1234567890"
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Bot Content</label>
              <textarea
                rows={3}
                value={config.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        {selectedNode.type === 'sheets' && (
          <>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Spreadsheet ID</label>
              <input
                type="text"
                value={config.spreadsheetId || ''}
                onChange={(e) => handleChange('spreadsheetId', e.target.value)}
                placeholder="1BxiMVs0XR..."
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Range</label>
              <input
                type="text"
                value={config.range || ''}
                onChange={(e) => handleChange('range', e.target.value)}
                placeholder="Sheet1!A:E"
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        {selectedNode.type === 'ai_prompt' && (
          <>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">User Prompt Instruction</label>
              <textarea
                rows={4}
                value={config.userPrompt || ''}
                onChange={(e) => handleChange('userPrompt', e.target.value)}
                placeholder="Describe AI operation logic..."
                className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        {selectedNode.type === 'trigger' && (
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Trigger Mechanism</label>
            <select
              value={config.triggerType || 'manual'}
              onChange={(e) => handleChange('triggerType', e.target.value)}
              className="w-full bg-[#131B29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="manual">On Demand / Manual Trigger</option>
              <option value="webhook">Inbound Webhook HTTP</option>
              <option value="cron">Scheduled Cron Job</option>
            </select>
          </div>
        )}
      </div>

      {/* Delete Button */}
      <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
        <button
          onClick={() => removeNode(selectedNode.id)}
          className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Node
        </button>
        <button
          onClick={() => selectNode(null)}
          className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    </div>
  );
}
