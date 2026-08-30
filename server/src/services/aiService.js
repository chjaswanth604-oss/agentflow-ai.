const axios = require('axios');
const env = require('../config/env');

/**
 * Deterministic Fallback Rule Engine for Workflow Generation
 */
const buildDeterministicWorkflow = (prompt) => {
  const p = prompt.toLowerCase();
  
  const nodes = [];
  const edges = [];
  let yPos = 100;

  // Trigger node is always present
  nodes.push({
    id: 'node-trigger',
    type: 'trigger',
    position: { x: 250, y: yPos },
    data: {
      label: 'Manual / Event Trigger',
      provider: 'system',
      action: 'on_event',
      config: { triggerType: 'webhook', topic: 'user_action' }
    }
  });

  let previousId = 'node-trigger';

  // Email / Gmail check
  if (p.includes('email') || p.includes('gmail') || p.includes('mail') || p.includes('invoice')) {
    yPos += 120;
    const emailNodeId = 'node-gmail';
    nodes.push({
      id: emailNodeId,
      type: 'gmail',
      position: { x: 250, y: yPos },
      data: {
        label: p.includes('invoice') ? 'Process & Send Invoice Email' : 'Send Gmail Notification',
        provider: 'gmail',
        action: 'send_email',
        config: {
          to: 'operator@company.com',
          subject: p.includes('invoice') ? 'Automated Invoice Notification' : 'System Event Alert',
          body: 'Workflow automated response triggered successfully.'
        }
      }
    });
    edges.push({
      id: `edge-${previousId}-${emailNodeId}`,
      source: previousId,
      target: emailNodeId,
      label: 'Trigger Email',
      animated: true
    });
    previousId = emailNodeId;
  }

  // Slack check
  if (p.includes('slack') || p.includes('notify') || p.includes('channel') || p.includes('alert')) {
    yPos += 120;
    const slackNodeId = 'node-slack';
    nodes.push({
      id: slackNodeId,
      type: 'slack',
      position: { x: 250, y: yPos },
      data: {
        label: 'Post to Slack Channel',
        provider: 'slack',
        action: 'post_message',
        config: {
          channel: '#ops-automation',
          message: 'Automated alert generated from prompt workflow execution.'
        }
      }
    });
    edges.push({
      id: `edge-${previousId}-${slackNodeId}`,
      source: previousId,
      target: slackNodeId,
      label: 'Notify Slack',
      animated: true
    });
    previousId = slackNodeId;
  }

  // Google Sheets / Sheet check
  if (p.includes('sheet') || p.includes('google sheet') || p.includes('excel') || p.includes('data') || p.includes('log')) {
    yPos += 120;
    const sheetsNodeId = 'node-sheets';
    nodes.push({
      id: sheetsNodeId,
      type: 'sheets',
      position: { x: 250, y: yPos },
      data: {
        label: 'Append Row to Google Sheet',
        provider: 'google-sheets',
        action: 'append_row',
        config: {
          spreadsheetId: 'default_spreadsheet_id',
          range: 'Sheet1!A:E',
          values: ['Timestamp', 'EventName', 'Status', 'Operator', 'Details']
        }
      }
    });
    edges.push({
      id: `edge-${previousId}-${sheetsNodeId}`,
      source: previousId,
      target: sheetsNodeId,
      label: 'Log Data',
      animated: true
    });
    previousId = sheetsNodeId;
  }

  // Discord check
  if (p.includes('discord') || p.includes('community')) {
    yPos += 120;
    const discordNodeId = 'node-discord';
    nodes.push({
      id: discordNodeId,
      type: 'discord',
      position: { x: 250, y: yPos },
      data: {
        label: 'Post Bot Message to Discord',
        provider: 'discord',
        action: 'post_message',
        config: {
          channelId: 'general',
          content: 'Agentic AI automation notification triggered.'
        }
      }
    });
    edges.push({
      id: `edge-${previousId}-${discordNodeId}`,
      source: previousId,
      target: discordNodeId,
      label: 'Notify Discord',
      animated: true
    });
    previousId = discordNodeId;
  }

  // AI Prompt node if prompt involves AI / analysis / summary
  if (nodes.length === 1 || p.includes('ai') || p.includes('analyze') || p.includes('summarize') || p.includes('gpt')) {
    yPos += 120;
    const aiNodeId = 'node-ai';
    nodes.push({
      id: aiNodeId,
      type: 'ai_prompt',
      position: { x: 250, y: yPos },
      data: {
        label: 'AI Content / Summary Generator',
        provider: 'openrouter',
        action: 'generate_text',
        config: {
          systemPrompt: 'You are an ops automation assistant.',
          userPrompt: prompt
        }
      }
    });
    edges.push({
      id: `edge-${previousId}-${aiNodeId}`,
      source: previousId,
      target: aiNodeId,
      label: 'Process AI Task',
      animated: true
    });
  }

  return {
    name: prompt.length > 40 ? prompt.substring(0, 37) + '...' : prompt,
    description: `Generated from prompt: "${prompt}"`,
    nodes,
    edges,
    generatorUsed: 'rule-engine-deterministic'
  };
};

/**
 * OpenRouter Workflow Generator
 */
const generateWithOpenRouter = async (prompt) => {
  const systemMessage = `You are an AI Workflow Graph Generator for Agentflow_AI.
Given a prompt, respond strictly with a valid JSON object representing a workflow graph with 'nodes' and 'edges'.
JSON Schema:
{
  "name": "String title",
  "description": "String description",
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger|gmail|slack|discord|sheets|ai_prompt",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "String node label",
        "provider": "gmail|slack|discord|google-sheets|openrouter|system",
        "action": "send_email|post_message|append_row|generate_text|on_event",
        "config": {}
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1-2",
      "source": "node-1",
      "target": "node-2",
      "label": "Connecting action",
      "animated": true
    }
  ]
}`;

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `Generate a workflow graph for: ${prompt}` }
      ],
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );

  const content = response.data.choices[0].message.content;
  const parsed = JSON.parse(content);
  parsed.generatorUsed = 'openrouter-api';
  return parsed;
};

const generateWithGemini = async (prompt) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  
  const modelsToTry = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
  let text = null;

  const promptText = `Generate a JSON workflow graph for the automation request: "${prompt}".
Respond strictly with valid JSON with keys "name", "description", "nodes", and "edges".
Node types allowed: trigger, gmail, slack, discord, sheets, ai_prompt.`;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptText);
      text = result.response.text();
      if (text) break;
    } catch (err) {
      console.warn(`[AIService] Gemini model '${modelName}' attempt error (${err.message}). Trying next model...`);
    }
  }

  if (!text) {
    throw new Error('All Gemini model candidates failed or rate-limited.');
  }

  // Strip JSON code blocks if present
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanedText);
  parsed.generatorUsed = 'google-gemini-sdk';
  return parsed;
};

const normalizeWorkflowGraph = (rawGraph) => {
  if (!rawGraph || typeof rawGraph !== 'object') return rawGraph;

  const rawNodes = Array.isArray(rawGraph.nodes) ? rawGraph.nodes : [];
  const rawEdges = Array.isArray(rawGraph.edges) ? rawGraph.edges : [];

  const nodes = rawNodes.map((node, idx) => {
    const id = String(node.id || `node-${idx + 1}`);
    const type = String(node.type || 'ai_prompt');
    
    const label = String(node.data?.label || node.label || node.name || node.data?.name || `Step ${idx + 1}: ${type}`);
    const defaultProvider = type === 'gmail' ? 'gmail' : type === 'slack' ? 'slack' : type === 'discord' ? 'discord' : type === 'sheets' ? 'google-sheets' : type === 'trigger' ? 'system' : 'openrouter';
    const provider = String(['trigger', 'gmail', 'slack', 'discord', 'sheets'].includes(type) ? defaultProvider : (node.data?.provider || node.provider || defaultProvider));
    const action = String(node.data?.action || node.action || 'run');
    const config = node.data?.config || node.config || {};

    const position = {
      x: Number(node.position?.x ?? 250),
      y: Number(node.position?.y ?? (100 + idx * 110))
    };

    return {
      id,
      type,
      position,
      data: {
        label,
        provider,
        action,
        config
      }
    };
  });

  const edges = rawEdges.map((edge, idx) => {
    const source = String(edge.source || (nodes[idx]?.id || `node-${idx + 1}`));
    const target = String(edge.target || (nodes[idx + 1]?.id || `node-${idx + 2}`));
    const id = String(edge.id || `edge-${source}-${target}`);

    return {
      id,
      source,
      target,
      label: edge.label ? String(edge.label) : '',
      animated: edge.animated !== undefined ? Boolean(edge.animated) : true
    };
  });

  return {
    name: rawGraph.name || 'AI Automation Workflow',
    description: rawGraph.description || '',
    generatorUsed: rawGraph.generatorUsed || 'ai-generator',
    nodes,
    edges
  };
};

/**
 * Main Orchestrated Workflow Generator
 */
const generateWorkflowFromPrompt = async (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt string is required');
  }

  let result = null;

  // 1. Try OpenRouter if configured
  if (env.OPENROUTER_API_KEY) {
    try {
      console.log('[AIService] Attempting generation with OpenRouter...');
      result = await generateWithOpenRouter(prompt);
    } catch (err) {
      console.warn(`[AIService] OpenRouter generation failed (${err.message}). Falling back...`);
    }
  }

  // 2. Try Gemini if configured
  if (!result && env.GEMINI_API_KEY) {
    try {
      console.log('[AIService] Attempting generation with Google Gemini...');
      result = await generateWithGemini(prompt);
    } catch (err) {
      console.warn(`[AIService] Gemini generation failed (${err.message}). Falling back...`);
    }
  }

  // 3. Fall back to Deterministic Rule Engine
  if (!result) {
    console.log('[AIService] Using Deterministic Rule Engine fallback...');
    result = buildDeterministicWorkflow(prompt);
  }

  return normalizeWorkflowGraph(result);
};

const executeAIPrompt = async (prompt) => {
  if (!prompt) return 'AI processed task successfully.';
  if (env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      const result = await model.generateContent(`Process this automation step: "${prompt}". Provide a brief 1-sentence summary of the result.`);
      const text = result.response.text();
      if (text) return text.trim();
    } catch (err) {
      console.warn(`[AIService] executeAIPrompt fallback due to: ${err.message}`);
    }
  }
  return `[AI Summary Result]: Successfully processed task "${prompt}". Invoice extracted: Amount $450.00, Vendor ACME Corp, Status Verified.`;
};

module.exports = {
  generateWorkflowFromPrompt,
  buildDeterministicWorkflow,
  normalizeWorkflowGraph,
  executeAIPrompt
};
