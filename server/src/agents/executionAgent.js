const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');
const integrationService = require('../services/integrationService');
const aiService = require('../services/aiService');

class ExecutionAgent {
  async executeNode(node, userId, inputContext = {}) {
    const { type, data } = node;
    const action = data?.action || 'run';
    const config = data?.config || {};

    // Normalize provider based on node type
    let provider = data?.provider || type;
    if (['trigger', 'gmail', 'slack', 'discord', 'sheets'].includes(type)) {
      provider = type === 'sheets' ? 'google-sheets' : (type === 'trigger' ? 'system' : type);
    }

    console.log(`[ExecutionAgent] Executing node ${node.id} (${node.data?.label || type}) - Type: ${type}, Provider: ${provider}`);

    // 1. Trigger node
    if (type === 'trigger' || provider === 'system') {
      return {
        status: 'SUCCESS',
        nodeId: node.id,
        output: { triggeredAt: new Date().toISOString(), ...inputContext }
      };
    }

    // Find previous node outputs from DAG context
    const previousOutputs = Object.values(inputContext.outputs || {});
    let latestEmail = previousOutputs.find(o => o?.latestEmail)?.latestEmail;
    if (!latestEmail) {
      const emailOutput = previousOutputs.find(o => o?.subject || o?.snippet || o?.from);
      if (emailOutput) {
        latestEmail = {
          subject: emailOutput.subject || '',
          from: emailOutput.from || '',
          snippet: emailOutput.snippet || emailOutput.message || ''
        };
      }
    }
    const aiOutput = previousOutputs.find(o => o?.generatedText)?.generatedText;

    // 2. AI Prompt Node
    if (type === 'ai_prompt' || provider === 'openrouter' || provider === 'gemini') {
      let userPrompt = config.userPrompt || inputContext.prompt || node.data?.label || 'Process automation task';
      if (latestEmail) {
        userPrompt += `\n\nIncoming Email Context:\nFrom: ${latestEmail.from}\nSubject: ${latestEmail.subject}\nBody/Snippet: ${latestEmail.snippet}`;
      }
      const aiSummaryText = await aiService.executeAIPrompt(userPrompt);
      return {
        status: 'SUCCESS',
        nodeId: node.id,
        output: {
          prompt: userPrompt,
          generatedText: aiSummaryText,
          executedAt: new Date().toISOString()
        }
      };
    }

    // 3. Third-party integration nodes
    let credentials = null;
    try {
      if (['gmail', 'slack', 'discord', 'google-sheets'].includes(provider)) {
        credentials = await integrationService.getIntegrationCredentials(userId, provider);
      }
    } catch (err) {
      if (err.code === 'INTEGRATION_NOT_CONNECTED' || err.code === 'AUTH_EXPIRED') {
        console.warn(`[ExecutionAgent] ${err.message}. Running in simulated mode for node ${node.id}`);
        credentials = { simulated: true };
      } else {
        throw err;
      }
    }

    switch (provider) {
      case 'gmail':
        const gmailRes = await gmailIntegration.execute(credentials, 'read_mail', config);
        
        // Also send automated confirmation email notification to user
        try {
          const recipient = config.to || 'chjaswanth604@gmail.com';
          const notificationSubject = `Invoice Notification - ${gmailRes.latestEmail?.subject || 'Processed Update'}`;
          const notificationBody = `Invoice automation workflow executed at ${new Date().toLocaleString()}.\nProcessed email: ${gmailRes.latestEmail?.subject || 'Invoice Email'}\nSender: ${gmailRes.latestEmail?.from || 'Incoming Email'}\nSnippet: ${gmailRes.latestEmail?.snippet || ''}`;
          
          await gmailIntegration.execute(credentials, 'send_email', {
            to: recipient,
            subject: notificationSubject,
            body: notificationBody
          });
        } catch (notifErr) {
          console.warn(`[ExecutionAgent] Could not send confirmation email: ${notifErr.message}`);
        }

        return { status: 'SUCCESS', nodeId: node.id, output: gmailRes };

      case 'slack':
        const slackRes = await slackIntegration.execute(credentials, action, config);
        return { status: 'SUCCESS', nodeId: node.id, output: slackRes };

      case 'discord':
        const discordRes = await discordIntegration.execute(credentials, action, config);
        return { status: 'SUCCESS', nodeId: node.id, output: discordRes };

      case 'google-sheets':
        // Dynamically extract real row values from Gmail + AI context if available
        let rowValues = config.values;
        // Detect template variables in 1D or 2D arrays reliably
        const hasTemplateVariables = JSON.stringify(rowValues || '').includes('{{');

        if (!rowValues || rowValues.length === 0 || hasTemplateVariables) {
          if (!latestEmail) {
            console.log('[ExecutionAgent] No new unread invoice email found. Skipping Google Sheets append.');
            return {
              status: 'SUCCESS',
              nodeId: node.id,
              output: { message: 'No new unread invoice email to append' }
            };
          }

          const timestampDefault = new Date().toLocaleDateString('en-US');

          const fromStr = latestEmail.from || '';
          const subjStr = latestEmail.subject || '';
          const snipStr = latestEmail.snippet || '';
          const fullText = `${subjStr} ${snipStr}`;

          // Default sender and subject from real incoming email
          let vendor = fromStr.replace(/<.*>/, '').replace(/"/g, '').trim() || 'Invoice Sender';
          let invoiceNo = subjStr.trim() || 'Invoice Email';
          let amount = '$100.00';
          let dateVal = timestampDefault;

          // 1. Universal User / Sender Name Extraction
          const custMatch = fullText.match(/Customer\s*Name:\s*([^\r\n\-]+)/i) || fullText.match(/Vendor:\s*([^\r\n\-]+)/i);
          if (custMatch && custMatch[1].trim()) {
            vendor = custMatch[1].trim();
          } else if (subjStr.toLowerCase().includes('from')) {
            const parts = subjStr.split(/from/i);
            const candidateName = parts[parts.length - 1].replace(/#\d+/, '').trim();
            if (candidateName) vendor = candidateName;
          }

          // 2. Universal Invoice Number Extraction
          const invMatch = fullText.match(/(Invoice\s*#?\s*\w+)/i) || 
                           fullText.match(/Invoice\s*Number:\s*([^\r\n\-]+)/i) || 
                           fullText.match(/(INV-[A-Z0-9-]+)/i);
          if (invMatch && invMatch[1].trim()) {
            invoiceNo = invMatch[1].trim();
          }

          // 3. Universal Amount Extraction (Supports ₹, $, Rs, INR, Euro, £)
          const amtMatch = fullText.match(/Amount:\s*([₹$€£\w.]*\s*\d+[\d,.]*)/i) || 
                           fullText.match(/Total\s*due:\s*([₹$€£\w.]*\s*\d+[\d,.]*)/i) || 
                           fullText.match(/due:\s*([₹$€£\w.]*\s*\d+[\d,.]*)/i) || 
                           fullText.match(/([₹$€£]\s*\d+[\d,.]*)/);
          if (amtMatch && amtMatch[1].trim()) {
            amount = amtMatch[1].trim();
          }

          // 4. Universal Date / Due Date Extraction (Handles "Due date sep 8,2026" with/without colon)
          const dateMatch = fullText.match(/Due\s*date\s*:?\s*([a-zA-Z0-9,\s]+)/i) || 
                            fullText.match(/Duedate\s*:?\s*([a-zA-Z0-9,\s]+)/i) || 
                            fullText.match(/Invoice\s*Date\s*:?\s*([a-zA-Z0-9,\s]+)/i) || 
                            fullText.match(/Date\s*:?\s*([a-zA-Z0-9,\s]+)/i);
          if (dateMatch && dateMatch[1].trim()) {
            dateVal = dateMatch[1].trim();
          }

          rowValues = [[vendor, dateVal, amount, 'Invoice', invoiceNo]];
        }

        const sheetsConfig = { ...config, values: rowValues };
        const sheetsRes = await googleSheetsIntegration.execute(credentials, action, sheetsConfig);
        return { status: 'SUCCESS', nodeId: node.id, output: sheetsRes };

      default:
        return {
          status: 'SUCCESS',
          nodeId: node.id,
          output: { message: `Simulated generic execution for ${node.id}`, data: config }
        };
    }
  }
}

module.exports = new ExecutionAgent();
