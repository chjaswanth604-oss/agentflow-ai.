import { Zap, Mail, MessageSquare, Bot, Table, Sparkles, Plus } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodePalette() {
  const { addNode, nodes } = useWorkflowStore();

  const nodeLibrary = [
    {
      type: 'trigger',
      label: 'Manual Event Trigger',
      provider: 'system',
      action: 'on_event',
      icon: Zap,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      defaultConfig: { triggerType: 'manual', eventName: 'webhook_event' }
    },
    {
      type: 'gmail',
      label: 'Gmail Send / Read',
      provider: 'gmail',
      action: 'send_email',
      icon: Mail,
      color: 'text-red-400 border-red-500/30 bg-red-500/10',
      defaultConfig: { to: 'operator@company.com', subject: 'Workflow Notification', body: 'Automated email text.' }
    },
    {
      type: 'slack',
      label: 'Slack Channel Post',
      provider: 'slack',
      action: 'post_message',
      icon: MessageSquare,
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      defaultConfig: { channel: '#ops-automation', message: 'Alert notification triggered.' }
    },
    {
      type: 'discord',
      label: 'Discord Bot Post',
      provider: 'discord',
      action: 'post_message',
      icon: Bot,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      defaultConfig: { channelId: 'general', content: 'Agentic bot update.' }
    },
    {
      type: 'sheets',
      label: 'Google Sheet Append',
      provider: 'google-sheets',
      action: 'append_row',
      icon: Table,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      defaultConfig: { spreadsheetId: 'default_sheet_id', range: 'Sheet1!A:E', values: ['Row item 1', 'Row item 2'] }
    },
    {
      type: 'ai_prompt',
      label: 'AI Model Generator',
      provider: 'openrouter',
      action: 'generate_text',
      icon: Sparkles,
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      defaultConfig: { userPrompt: 'Summarize automation inputs and extract key facts.', systemPrompt: 'Ops Assistant' }
    }
  ];

  const handleAdd = (item) => {
    const id = `node-${Date.now().toString(36)}`;
    const yPos = 100 + nodes.length * 90;
    const newNode = {
      id,
      type: item.type,
      position: { x: 250, y: yPos },
      data: {
        label: item.label,
        provider: item.provider,
        action: item.action,
        config: { ...item.defaultConfig }
      }
    };
    addNode(newNode);
  };

  return (
    <div className="w-64 border-r border-slate-800 bg-[#0F172A]/70 p-3 flex flex-col h-full shrink-0">
      <div className="mb-3 px-1">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Node Library</h3>
        <p className="text-[10px] text-slate-400">Click to add step to canvas</p>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {nodeLibrary.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => handleAdd(item)}
              className="w-full text-left p-2.5 rounded-lg border border-slate-800 bg-[#131B29]/60 hover:bg-[#1E293B] hover:border-slate-700 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-md border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-200 group-hover:text-white">{item.label}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{item.provider}</p>
                </div>
              </div>
              <Plus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
